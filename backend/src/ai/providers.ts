import { BadGatewayException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type ProviderName = "gemini" | "openrouter";
export type ProviderMessage = { role: "user" | "model"; text: string };
export type ProviderSource = { title: string; url: string };
export type ProviderResult = { text: string; sources: ProviderSource[] };

type ProviderConfig = {
  provider: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
};

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
const logger = new Logger("AiProviders");

export async function generate(
  messages: ProviderMessage[],
  systemInstruction: string,
  config: ProviderConfig,
  preferredProvider?: ProviderName,
): Promise<ProviderResult> {
  const primary = preferredProvider ?? normalizeProvider(config.provider);
  const secondary: ProviderName = primary === "gemini" ? "openrouter" : "gemini";
  const providers: ProviderName[] = preferredProvider ? [primary] : [primary, secondary];
  let lastError: unknown;

  for (const provider of providers) {
    if (!hasProviderKey(provider, config)) {
      lastError = new ServiceUnavailableException(
        `${provider === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY"} is not configured.`,
      );
      logger.warn(`Skipping ${provider}: API key is not configured.`);
      continue;
    }

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const result =
          provider === "gemini"
            ? await generateWithGemini(messages, systemInstruction, config)
            : await generateWithOpenRouter(messages, systemInstruction, config);
        logger.log(`AI request handled by ${provider}.`);
        return result;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === RETRY_DELAYS_MS.length - 1) break;
        logger.warn(
          `${provider} attempt ${attempt + 1} failed with a retryable error; retrying in ${
            RETRY_DELAYS_MS[attempt]! / 1000
          }s.`,
        );
        await delay(RETRY_DELAYS_MS[attempt]!);
      }
    }
    if (provider !== providers.at(-1)) {
      logger.warn(`AI provider ${provider} failed; trying ${secondary}.`);
    }
  }

  if (lastError instanceof ServiceUnavailableException) throw lastError;
  throw new BadGatewayException(
    lastError instanceof Error
      ? `AI providers failed: ${lastError.message}`
      : "AI providers failed.",
  );
}

async function generateWithGemini(
  messages: ProviderMessage[],
  systemInstruction: string,
  config: ProviderConfig,
): Promise<ProviderResult> {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const response = await ai.models.generateContent({
    model: config.geminiModel ?? "gemini-3.5-flash-lite",
    contents: messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    })),
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
      maxOutputTokens: 700,
    },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return {
    text,
    sources: groundingSources(response.candidates?.[0]?.groundingMetadata),
  };
}

async function generateWithOpenRouter(
  messages: ProviderMessage[],
  systemInstruction: string,
  config: ProviderConfig,
): Promise<ProviderResult> {
  const client = new OpenAI({
    apiKey: config.openrouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 30_000,
    defaultHeaders: {
      "HTTP-Referer": process.env.FRONTEND_URL ?? "http://localhost:5173",
      "X-Title": "AgriSense",
    },
  });
  const response = await client.chat.completions.create({
    model: config.openrouterModel ?? "openrouter/auto",
    messages: [
      { role: "system", content: systemInstruction },
      ...messages.map((message) => ({
        role: message.role === "model" ? ("assistant" as const) : ("user" as const),
        content: message.text,
      })),
    ],
    temperature: 0.4,
    max_tokens: 700,
  });
  const choice = response.choices[0];
  const message = choice?.message;
  const text = extractOpenRouterText(message?.content);
  if (!text) {
    const refusal = typeof message?.refusal === "string" ? message.refusal.trim() : "";
    const reason = refusal || choice?.finish_reason || response.choices.length === 0
      ? refusal || `finish_reason=${choice?.finish_reason ?? "no choices"}`
      : "no text content";
    throw new Error(`OpenRouter returned no usable text (${reason}).`);
  }
  return { text, sources: [] };
}

function extractOpenRouterText(
  content:
    | string
    | Array<{ type?: string; text?: string }>
    | null
    | undefined,
): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeProvider(provider: string): ProviderName {
  if (provider === "openrouter") return "openrouter";
  return "gemini";
}

function hasProviderKey(provider: ProviderName, config: ProviderConfig): boolean {
  return Boolean(provider === "gemini" ? config.geminiApiKey : config.openrouterApiKey);
}

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number(error.status);
    return status === 429 || status >= 500;
  }
  if (error instanceof Error) {
    return /timeout|timed out|ETIMEDOUT|ECONNRESET|fetch failed/i.test(error.message);
  }
  return false;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function groundingSources(
  metadata:
    | {
        groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
      }
    | undefined,
): ProviderSource[] {
  const sources = new Map<string, ProviderSource>();
  for (const chunk of metadata?.groundingChunks ?? []) {
    const url = chunk.web?.uri;
    if (!url || !/^https?:\/\//.test(url)) continue;
    sources.set(url, {
      url,
      title: chunk.web?.title?.trim() || new URL(url).hostname,
    });
  }
  return [...sources.values()].slice(0, 8);
}
