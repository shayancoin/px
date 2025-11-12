import { SchemaType, type ResponseSchema } from "@google/generative-ai";

import { MODULE_IDS } from "@/domain/spec";

export const FUSE_JSON_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: ["placements", "rationale"] as string[],
  properties: {
    placements: {
      type: SchemaType.ARRAY,
      minItems: 1,
      items: {
        type: SchemaType.OBJECT,
        required: ["roomId", "type", "x", "y"] as string[],
        properties: {
          roomId: {
            type: SchemaType.STRING,
            description:
              "Identifier of the room the module belongs to (e.g. show, prep, primary).",
          },
          type: {
            type: SchemaType.STRING,
            format: "enum",
            enum: Array.from(MODULE_IDS),
            description: "Module ID (e.g. CAFI, BARA) from the allowed list.",
          },
          x: {
            type: SchemaType.NUMBER,
            description:
              "Horizontal coordinate in millimetres from the global origin (top-left).",
          },
          y: {
            type: SchemaType.NUMBER,
            description:
              "Vertical coordinate in millimetres from the global origin (top-left).",
          },
          rotation: {
            type: SchemaType.NUMBER,
            description:
              "Optional rotation in degrees (0, 90, 180, 270). Defaults to 0.",
          },
          option: {
            type: SchemaType.STRING,
            description:
              "Optional cabinet option such as handle-less, integrated appliance, etc.",
          },
          note: {
            type: SchemaType.STRING,
            description:
              "Optional descriptive note explaining the cabinet placement intent.",
          },
        },
      },
    },
    rationale: {
      type: SchemaType.STRING,
      description:
        "Short explanation (≤120 words) describing optimisation decisions.",
    },
  },
} as const;

