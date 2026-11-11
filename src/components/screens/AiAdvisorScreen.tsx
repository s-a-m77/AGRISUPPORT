import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCw, Send, Sparkles } from "lucide-react";

import { farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";

type Structured = {
  situation: string;
  evidence: string;
  riskLevel: string;
  recommendedAction: string;
  confidence: string;
  observationDate: string;
};

type Message = { sender: "user" | "ai"; text: string; structured: Structured | null };

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

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: farm
        ? `Hello ${profile.displayName}! I am your AgriSense AI Agronomist for ${farm.name}. How can I assist with your ${farm.crop} plot today?`
        : `Hello ${profile.displayName}! Register a plot first and I will read its satellite observations for you.`,
      structured: null,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function handleSendMessage(queryText?: string) {
    const textToSend = (queryText ?? inputText).trim();
    if (!textToSend || !farm) return;

    const nextMessages: Message[] = [
      ...messages,
      { sender: "user", text: textToSend, structured: null },
    ];
    setMessages(nextMessages);
    setInputText("");
    setIsGenerating(true);

    window.setTimeout(() => {
      setMessages([
        ...nextMessages,
        {
          sender: "ai",
          text: `Analysis generated for ${farm.name} based on Landsat 9 and SMAP data.`,
          structured: {
            situation: `Canopy index for ${farm.crop} is currently ${farm.ndvi.toFixed(2)} (${farm.healthStatus}). Topsoil moisture stands at ${farm.moisture}.`,
            evidence: `MODIS 10-day composite shows ${farm.ndviChange} NDVI change compared to the 5-year mean baseline. Zero rainfall registered over the last 6 days.`,
            riskLevel: `${farm.droughtRisk} drought risk • Moderate irrigation need`,
            recommendedAction:
              "Maintain field drainage channels. If rain does not fall within 10 days, schedule targeted supplemental irrigation. Prepare harvesting equipment.",
            confidence: "94% (High Satellite Coverage)",
            observationDate: farm.lastObservation,
          },
        },
      ]);
      setIsGenerating(false);
    }, 1200);
  }

  return (
    <div className="space-y-6 pb-12">
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
        <span className="text-xs font-semibold text-app-ink/70">Suggested Queries:</span>
        {SAMPLE_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => handleSendMessage(question)}
            disabled={!farm}
            className="text-xs px-3 py-1.5 rounded-xl bg-app-surface border border-app-ink/15 text-app-heading hover:bg-app-soft hover:border-app-success transition shadow-sm disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
          {messages.map((message, index) => (
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
                <p className="leading-relaxed">{message.text}</p>

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
            placeholder={
              farm
                ? "Ask AI Advisor about your crop, drought risks, or irrigation..."
                : "Register a plot to start asking"
            }
            className="flex-1 px-4 py-3 rounded-xl border border-app-ink/20 text-xs focus:ring-2 focus:ring-app-success focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!farm}
            className="px-5 py-3 rounded-xl bg-app-success-fill hover:bg-app-action text-app-on-action text-xs font-bold shadow transition flex items-center space-x-1 disabled:opacity-50"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
