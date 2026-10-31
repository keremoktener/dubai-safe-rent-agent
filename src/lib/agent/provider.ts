import type { LlmKind } from "@/lib/domain";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  id: LlmKind;
  complete(messages: LlmMessage[]): Promise<string>;
}

export function resolveLlmKind(): LlmKind {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();
  if (forced === "mock") return "mock";
  if (forced === "openai") return process.env.OPENAI_API_KEY ? "openai" : "mock";
  if (forced === "anthropic") return process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}

export function getLlmProvider(): LlmProvider {
  const kind = resolveLlmKind();
  if (kind === "openai") return openAiProvider;
  if (kind === "anthropic") return anthropicProvider;
  return mockProvider;
}

const mockProvider: LlmProvider = {
  id: "mock",
  async complete(messages) {
    const last = messages[messages.length - 1]?.content ?? "";
    return last.slice(0, 280);
  },
};

const openAiProvider: LlmProvider = {
  id: "openai",
  async complete(messages) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is empty.");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status}).`);
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI returned an empty note.");
    return text;
  },
};

const anthropicProvider: LlmProvider = {
  id: "anthropic",
  async complete(messages) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is empty.");
    const system = messages.find((message) => message.role === "system")?.content;
    const dialogue = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 400,
        temperature: 0.2,
        system,
        messages: dialogue,
      }),
    });
    if (!response.ok) {
      throw new Error(`Anthropic request failed (${response.status}).`);
    }
    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = payload.content?.find((block) => block.type === "text")?.text?.trim();
    if (!text) throw new Error("Anthropic returned an empty note.");
    return text;
  },
};
