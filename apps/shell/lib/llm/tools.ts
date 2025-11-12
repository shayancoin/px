import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";

export const VALIDATE_FN_DECL: FunctionDeclaration = {
  name: "validateAndSnap",
  description:
    "Validate moduleId against the canonical set and snap x,y to grid.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            moduleId: { type: SchemaType.STRING },
            x: { type: SchemaType.NUMBER },
            y: { type: SchemaType.NUMBER },
          },
          required: ["moduleId", "x", "y"] as string[],
        },
      },
    },
    required: ["items"] as string[],
  },
};

