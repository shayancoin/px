import type OpenAI from "openai";

declare module "openai" {
  interface OpenAI {
    responses: {
      create: (...args: any[]) => Promise<any>;
    };
  }
}

