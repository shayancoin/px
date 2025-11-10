import OpenAI from "openai";

const OPENAI_MODEL =
  process.env.OPENAI_FUSE_MODEL ??
  process.env.OPENAI_MODEL ??
  "gpt-4.1-mini";

const OPENAI_MAX_RETRIES = Number(
  process.env.OPENAI_MAX_RETRIES ?? 3,
);
const OPENAI_INITIAL_BACKOFF_MS = Number(
  process.env.OPENAI_INITIAL_BACKOFF_MS ?? 400,
);

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) {
    return client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  client = new OpenAI({
    apiKey,
  });

  return client;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withOpenAIRetry<T>(
  fn: () => Promise<T>,
  retries: number = OPENAI_MAX_RETRIES,
  initialBackoffMs: number = OPENAI_INITIAL_BACKOFF_MS,
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

export { OPENAI_MODEL };



