import {
  FunctionCall,
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";

import type { FinishSelection } from "@/domain/spec";

import { FUSE_JSON_SCHEMA } from "@/lib/llm/schema";
import { VALIDATE_FN_DECL } from "@/lib/llm/tools";

type FuseInput = {
  systemPrompt: string;
  userPrompt: string;
  finishes: FinishSelection;
  model?: string;
};

type GeminiStrategy = "responses-schema" | "tool-call+schema";

type GeminiResult = {
  jsonText: string;
  provider: "gemini";
  strategy: GeminiStrategy;
  model: string;
};

const DEFAULT_MODEL =
  process.env.GEMINI_FUSE_MODEL ??
  process.env.GEMINI_MODEL ??
  "gemini-2.5-flash";

const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES ?? 3);
const GEMINI_INITIAL_BACKOFF_MS = Number(
  process.env.GEMINI_INITIAL_BACKOFF_MS ?? 400,
);

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = GEMINI_MAX_RETRIES,
  initialBackoffMs: number = GEMINI_INITIAL_BACKOFF_MS,
): Promise<T> {
  let attempt = 0;
  let backoff = initialBackoffMs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        throw error;
      }
      const jitter = Math.random() * 0.25 * backoff;
      await delay(backoff + jitter);
      backoff *= 2;
    }
  }
}

function toFunctionCallParts(functionCalls: FunctionCall[]): Part[] {
  return functionCalls.map((call) => ({
    functionCall: call,
  }));
}

function toFunctionResponseParts(functionCalls: FunctionCall[]): Part[] {
  return functionCalls.map((call) => ({
    functionResponse: {
      name: call.name,
      response: {
        ok: true,
      },
    },
  }));
}

export async function callGeminiWithSchema(
  input: FuseInput,
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const modelName = input.model ?? DEFAULT_MODEL;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: input.systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FUSE_JSON_SCHEMA,
    },
    tools: [
      {
        functionDeclarations: [VALIDATE_FN_DECL],
      },
    ],
  });

  const userContent: Content = {
    role: "user",
    parts: [{ text: input.userPrompt }],
  };

  return withRetry(async () => {
    const history: Content[] = [userContent];
    const first = await model.generateContent({
      contents: history,
    });

    const firstText = first.response.text();
    if (firstText && firstText.trim().startsWith("{")) {
      return {
        jsonText: firstText,
        provider: "gemini",
        strategy: "responses-schema",
        model: modelName,
      };
    }

    const functionCalls = first.response.functionCalls?.();
    if (!functionCalls || functionCalls.length === 0) {
      throw new Error("Gemini response missing JSON output and tool calls.");
    }

    const candidateContent = first.response.candidates?.[0]?.content;
    if (candidateContent) {
      history.push(candidateContent);
    } else {
      history.push({
        role: "model",
        parts: toFunctionCallParts(functionCalls),
      });
    }

    history.push({
      role: "function",
      parts: toFunctionResponseParts(functionCalls),
    });

    const second = await model.generateContent({
      contents: history,
    });

    const secondText = second.response.text();
    if (!secondText) {
      throw new Error("Gemini tool-call flow did not produce JSON output.");
    }

    return {
      jsonText: secondText,
      provider: "gemini",
      strategy: "tool-call+schema",
      model: modelName,
    };
  });
}

