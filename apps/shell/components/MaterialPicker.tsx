"use client";

import Image from "next/image";
import {
  DOOR_FINISH_IDS,
  MATERIAL_MANIFEST,
  TOP_FINISH_IDS,
  type FinishSelection,
} from "@/domain/spec";

type MaterialPickerProps = {
  selection: FinishSelection;
  onChange: (type: keyof FinishSelection, value: string) => void;
  readOnly?: boolean;
};

export function MaterialPicker({
  selection,
  onChange,
  readOnly = false,
}: MaterialPickerProps) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <section>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Doors
            </span>
            <h3 className="text-sm font-semibold text-white">
              Selected: {selection.door}
            </h3>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOOR_FINISH_IDS.map((doorId) => {
            const door = MATERIAL_MANIFEST.doors[doorId];
            const isActive = selection.door === doorId;
            return (
              <button
                key={doorId}
                type="button"
                onClick={() => !readOnly && onChange("door", doorId)}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-white bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
                } ${readOnly ? "cursor-default opacity-80" : ""}`}
                disabled={readOnly}
              >
                <span
                  className="h-10 w-10 rounded-xl"
                  style={{ backgroundColor: door.hex }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {doorId}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-white/40">
                    {door.token}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Countertops
            </span>
            <h3 className="text-sm font-semibold text-white">
              Selected: {selection.top}
            </h3>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOP_FINISH_IDS.map((topId) => {
            const top = MATERIAL_MANIFEST.tops[topId];
            const isActive = selection.top === topId;
            return (
              <button
                key={topId}
                type="button"
                onClick={() => !readOnly && onChange("top", topId)}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-white bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
                } ${readOnly ? "cursor-default opacity-80" : ""}`}
                disabled={readOnly}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={top.jpg}
                    alt={topId}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {topId}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-white/40">
                    {top.token}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

