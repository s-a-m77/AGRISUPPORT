import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageSquare, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";
import { useLang } from "@/lib/i18n";
import { askAiAdvisor, getAiChatHistory } from "@/lib/api";

type Structured = {
  situation: string;
  evidence: string;
  riskLevel: string;
  recommendedAction: string;
  confidence: string;
  observationDate: string;
};

type Message = {
  sender: "user" | "ai";
  text: string;
  structured: Structured | null;
  sources?: Array<{ title: string; url: string }>;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

function newConversationId() {
  return crypto.randomUUID();
}

const SAMPLE_QUESTIONS = [
  "Is my farm experiencing drought stress?",
  "What does my current NDVI value mean for harvesting?",
  "Has rainfall decreased compared to historical norms?",
  "What agronomic actions should I monitor this week?",
];

export function AiAdvisorScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);
  const { lang } = useLang();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: farm
        ? `Hello ${profile.displayName}! I am your AgriSense AI Agronomist for ${farm.name}. How can I assist with your ${farm.crop} plot today?`
        : `Hello ${profile.displayName}! Ask me a general farming question, or register a plot so I can include its satellite observations.`,
      structured: null,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "openrouter">("gemini");
  const [conversationId, setConversationId] = useState(newConversationId);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    let active = true;
    void getAiChatHistory()
      .then((history) => {
        if (!active || history.length === 0) return;
        const grouped = new Map<string, { messages: Message[]; title: string; updatedAt: string }>();
        for (const message of history) {
          const id = message.conversationId ?? "legacy";
          const existing = grouped.get(id) ?? { messages: [], title: "Previous chat", updatedAt: message.createdAt };
          existing.messages.push({
            sender: message.role === "user" ? "user" : "ai",
            text: message.text,
            structured: null,
          });
          if (message.role === "user" && existing.title === "Previous chat") {
            existing.title = message.text.slice(0, 48);
          }
          existing.updatedAt = message.createdAt;
          grouped.set(id, existing);
        }
        const loaded = [...grouped.entries()]
          .map(([id, value]) => ({ id, title: value.title, updatedAt: value.updatedAt }))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        const selected = loaded[0];
        setConversations(loaded);
        if (selected) {
          setConversationId(selected.id === "legacy" ? newConversationId() : selected.id);
          setMessages(grouped.get(selected.id)?.messages ?? []);
        }
      })
      .catch(() => {
        // The chat remains usable when history cannot be loaded.
      })
      .finally(() => {
        if (active) setHistoryLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  function startNewChat() {
    if (isGenerating) return;
    setConversationId(newConversationId());
    setMessages([]);
  }

  function selectConversation(selectedId: string) {
    if (isGenerating) return;
    void getAiChatHistory().then((history) => {
      const selected = history.filter((message) => (message.conversationId ?? "legacy") === selectedId);
      setConversationId(selectedId === "legacy" ? newConversationId() : selectedId);
      setMessages(
        selected.map((message) => ({
          sender: message.role === "user" ? "user" : "ai",
          text: message.text,
          structured: null,
        })),
      );
    });
  }

  async function handleSendMessage(queryText?: string) {
    const textToSend = (queryText ?? inputText).trim();
    if (!textToSend || isGenerating) return;

    const nextMessages: Message[] = [
      ...messages,
      { sender: "user", text: textToSend, structured: null },
    ];
    setMessages(nextMessages);
    setInputText("");
    setIsGenerating(true);

    try {
      const result = await askAiAdvisor({
        messages: nextMessages
          .filter((message) => message.sender !== "ai" || message.text !== nextMessages[0]?.text)
          .map((message) => ({
            role: message.sender === "user" ? "user" : "model",
            text: message.text,
          })),
        farmId: farm?.id,
        provider,
        conversationId,
        responseLanguage: lang,
      });
      setConversations((current) => [
        { id: conversationId, title: textToSend.slice(0, 48), updatedAt: new Date().toISOString() },
        ...current.filter((item) => item.id !== conversationId),
      ]);
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: result.text,
          structured: null,
          sources: result.sources,
        },
      ]);
    } catch (error) {
      setMessages(nextMessages);
      const message = error instanceof Error ? error.message : "The AI Advisor is unavailable.";
      setMessages((current) => [...current, { sender: "ai", text: message, structured: null }]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 pb-12">
      <aside className="lg:w-64 shrink-0 bg-app-nav text-app-nav-ink rounded-2xl p-3 shadow-sm lg:min-h-[620px]">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2 rounded-xl border border-app-nav-ink/20 px-3 py-2.5 text-sm font-semibold hover:bg-app-nav-ink/10"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
        <p className="px-2 pt-5 pb-2 text-[10px] uppercase tracking-wider text-app-nav-ink/60">
          Chat history
        </p>
        <div className="space-y-1 max-h-[520px] overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${
                conversation.id === conversationId
                  ? "bg-app-success-fill text-app-on-action"
                  : "text-app-nav-ink/80 hover:bg-app-nav-ink/10"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{conversation.title}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="px-2 text-xs text-app-nav-ink/50">Your saved chats appear here.</p>
          )}
        </div>
      </aside>

      <div className="space-y-6 min-w-0 flex-1">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-app-heading">AI Agronomist Decision Advisor</h1>
          <p className="text-xs text-app-ink/70">
            Context-aware advice backed by NASA Earth Observation satellite observations.
          </p>
        </div>
        <span className="text-xs font-bold text-app-heading bg-app-soft px-3 py-1 rounded-full border border-app-success/30 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-app-warning" />
          <span>NASA Data Grounded</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-app-ink/70">
          AI provider
          <select
            value={provider}
            onChange={(event) => {
              if (event.target.value === "gemini" || event.target.value === "openrouter") {
                setProvider(event.target.value);
              }
            }}
            disabled={isGenerating}
            className="rounded-lg border border-app-ink/20 bg-app-surface px-2.5 py-1.5 text-xs text-app-heading focus:ring-2 focus:ring-app-success focus:outline-none"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
        <span className="text-xs font-semibold text-app-ink/70">Suggested Queries:</span>
        {SAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => handleSendMessage(question)}
            disabled={isGenerating}
            className="text-xs px-3 py-1.5 rounded-xl bg-app-surface border border-app-ink/15 text-app-heading hover:bg-app-soft hover:border-app-success transition shadow-sm disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
          {historyLoaded &&
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs space-y-3 ${
                    message.sender === "user"
                      ? "bg-app-action text-app-on-action rounded-tr-none"
                      : "bg-app-bg border border-app-ink/10 text-app-ink rounded-tl-none"
                  }`}
                >
                  {message.sender === "ai" ? (
                    <div className="prose prose-sm max-w-none text-inherit prose-headings:text-inherit prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-strong:text-inherit">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-app-ink/15">
                              <table className="w-full min-w-[420px] border-collapse text-left text-[11px]">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-app-soft px-3 py-2 font-bold border-b border-app-ink/15">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 border-b border-app-ink/10 align-top">
                              {children}
                            </td>
                          ),
                          code: ({ children }) => (
                            <code className="rounded bg-app-soft px-1 py-0.5 text-[11px]">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{message.text}</p>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="border-t border-app-ink/15 pt-3 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-app-ink/60">
                        Sources
                      </p>
                      {message.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] text-app-info underline"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  )}

                  {message.structured && (
                    <div className="mt-3 pt-3 border-t border-app-ink/15 space-y-2 bg-app-surface p-3 rounded-xl text-[11px] text-app-ink">
                      <div className="flex items-center justify-between text-app-success font-bold">
                        <span>1. Situation Assessment</span>
                        <span className="text-[10px] bg-app-soft px-2 py-0.5 rounded-full">
                          {message.structured.confidence}
                        </span>
                      </div>
                      <p>{message.structured.situation}</p>

                      <div className="font-bold text-app-heading pt-1">
                        2. Satellite Data Evidence
                      </div>
                      <p className="text-app-ink/80">{message.structured.evidence}</p>

                      <div className="font-bold text-app-warning pt-1">3. Risk Classification</div>
                      <p>{message.structured.riskLevel}</p>

                      <div className="font-bold text-app-success pt-1">
                        4. Recommended Agronomic Action
                      </div>
                      <p className="bg-app-soft p-2 rounded-lg font-semibold text-app-heading">
                        {message.structured.recommendedAction}
                      </p>

                      <div className="text-[10px] text-app-ink/60 pt-1 text-right">
                        {message.structured.observationDate}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-app-soft text-app-success text-xs p-3 rounded-xl animate-pulse flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fetching Landsat 9 telemetry & calculating recommendations...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-3 border-t border-app-ink/10">
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSendMessage()}
            placeholder={"Ask AI Advisor about your crop, drought risks, or irrigation..."}
            className="flex-1 px-4 py-3 rounded-xl border border-app-ink/20 text-xs focus:ring-2 focus:ring-app-success focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isGenerating || !inputText.trim()}
            className="px-5 py-3 rounded-xl bg-app-success-fill hover:bg-app-action text-app-on-action text-xs font-bold shadow transition flex items-center space-x-1 disabled:opacity-50"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
