"use client";

import { useMemo } from "react";
import {
  LAYOUT_LIST,
  MAX_LAYOUT_SELECTION,
  MIN_LAYOUT_SELECTION,
  type LayoutId,
} from "@/domain/spec";

type LayoutSelectorProps = {
  selected: LayoutId[];
  onToggle: (layoutId: LayoutId) => void;
};

export function LayoutSelector({ selected, onToggle }: LayoutSelectorProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {LAYOUT_LIST.map((layout) => {
        const isSelected = selectedSet.has(layout.id);
        const disabled =
          !isSelected &&
          selected.length >= MAX_LAYOUT_SELECTION;

        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => onToggle(layout.id)}
            disabled={disabled}
            className={`group flex flex-col gap-3 rounded-3xl border px-5 py-6 text-left transition-all ${
              isSelected
                ? "border-white bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
            } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                {layout.id.replace(/_/g, " ")}
              </span>
              <span
                className={`h-3 w-3 rounded-full border transition ${
                  isSelected
                    ? "border-white bg-white"
                    : "border-white/40 group-hover:border-white/70"
                }`}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                {layout.name}
              </h3>
              <p className="text-sm text-white/60">{layout.summary}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/50">
              {layout.rooms.map((room) => (
                <div key={room.id} className="flex flex-col gap-0.5">
                  <span className="font-semibold text-white/60 uppercase tracking-wide">
                    {room.label}
                  </span>
                  <span>
                    {room.width}×{room.depth} mm
                  </span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
      <div className="col-span-full flex justify-end text-xs uppercase tracking-[0.4em] text-white/40">
        Select {MIN_LAYOUT_SELECTION} – {MAX_LAYOUT_SELECTION} layouts
      </div>
    </div>
  );
}



