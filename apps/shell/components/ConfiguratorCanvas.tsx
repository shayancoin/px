"use client";

import { useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Group,
  Text,
  Line,
} from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import {
  MATERIAL_MANIFEST,
  MODULES,
  type FinishSelection,
  type LayoutRoom,
  type ModulePlacement,
  type ModuleSpec,
  type TopFinishId,
  MILLIMETER_TO_PIXEL,
} from "@/domain/spec";

const SNAP_MM = 10;
const GRID_MM = 500;
const MODULE_LABEL_PADDING = 12;

export interface CanvasPlacement extends ModulePlacement {
  id: string;
  locked?: boolean;
}

export interface ConfiguratorCanvasProps {
  room: LayoutRoom;
  placements: CanvasPlacement[];
  finishes: FinishSelection;
  scale?: number;
  readOnly?: boolean;
  selectedIds?: string[];
  onPlacementMove?: (placementId: string, nextPosition: { x: number; y: number }) => void;
  onPlacementSelect?: (placementId: string) => void;
  stageRef?: React.RefObject<KonvaStage>;
}

function snapToGrid(value: number, step: number) {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getModuleFootprint(module: ModuleSpec, scale: number) {
  return {
    widthPx: module.width * scale,
    depthPx: module.depth * scale,
  };
}

const DEFAULT_DOOR_COLOR = "#777777";
const DEFAULT_TOP_COLOR = "#CCCCCC";

function useTopPattern(topFinishId: TopFinishId | undefined) {
  const material = topFinishId
    ? MATERIAL_MANIFEST.tops[topFinishId]
    : undefined;
  const [image] = useImage(material?.jpg ?? "", "anonymous");
  return {
    image: image ?? null,
    material,
  };
}

export function ConfiguratorCanvas({
  room,
  placements,
  finishes,
  scale = MILLIMETER_TO_PIXEL,
  readOnly = false,
  selectedIds,
  onPlacementMove,
  onPlacementSelect,
  stageRef,
}: ConfiguratorCanvasProps) {
  const stageWidthPx = room.width * scale;
  const stageHeightPx = room.depth * scale;
  const selectedSet = useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds],
  );

  const doorMaterial = finishes.door
    ? MATERIAL_MANIFEST.doors[finishes.door]
    : undefined;
  const doorColor = doorMaterial?.hex ?? DEFAULT_DOOR_COLOR;

  const { image: topImage, material: topMaterial } = useTopPattern(
    finishes.top,
  );

  const gridLines = useMemo(() => {
    const lines: Array<{
      key: string;
      points: number[];
    }> = [];
    const gridStepPx = GRID_MM * scale;

    for (let x = 0; x <= stageWidthPx; x += gridStepPx) {
      lines.push({
        key: `v-${x}`,
        points: [x, 0, x, stageHeightPx],
      });
    }

    for (let y = 0; y <= stageHeightPx; y += gridStepPx) {
      lines.push({
        key: `h-${y}`,
        points: [0, y, stageWidthPx, y],
      });
    }

    return lines;
  }, [scale, stageHeightPx, stageWidthPx]);

  return (
    <Stage
      width={stageWidthPx}
      height={stageHeightPx}
      ref={stageRef}
      className="rounded-3xl border border-white/10 bg-neutral-900"
    >
      <Layer listening={false}>
        <Rect
          x={0}
          y={0}
          width={stageWidthPx}
          height={stageHeightPx}
          fill="#0f1014"
          cornerRadius={24}
        />
        {gridLines.map((line) => (
          <Line
            key={line.key}
            points={line.points}
            stroke="#1f2230"
            strokeWidth={1}
            listening={false}
          />
        ))}
        <Rect
          x={0}
          y={0}
          width={stageWidthPx}
          height={stageHeightPx}
          stroke="#363a4f"
          strokeWidth={2}
          listening={false}
          cornerRadius={24}
        />
      </Layer>

      <Layer>
        {placements.map((placement) => {
          const moduleSpec = MODULES[placement.moduleId];
          if (!moduleSpec) {
            return null;
          }

          const shouldRenderTop =
            moduleSpec.category === "Base" || moduleSpec.category === "Snack";
          const isSelected = selectedSet.has(placement.id);
          const { widthPx, depthPx } = getModuleFootprint(moduleSpec, scale);
          const localXmm = placement.x - room.origin.x;
          const localYmm = placement.y - room.origin.y;
          const initialX = localXmm * scale;
          const initialY = localYmm * scale;

          return (
            <Group
              key={placement.id}
              x={initialX}
              y={initialY}
              draggable={!readOnly && !placement.locked}
              onDragEnd={(evt) => {
                const node = evt.target;
                const rawXmm = node.x() / scale;
                const rawYmm = node.y() / scale;

                const snappedLocalXmm = snapToGrid(rawXmm, SNAP_MM);
                const snappedLocalYmm = snapToGrid(rawYmm, SNAP_MM);

                const clampedLocalXmm = clamp(
                  snappedLocalXmm,
                  0,
                  Math.max(room.width - moduleSpec.width, 0),
                );
                const clampedLocalYmm = clamp(
                  snappedLocalYmm,
                  0,
                  Math.max(room.depth - moduleSpec.depth, 0),
                );

                const resolvedXpx = clampedLocalXmm * scale;
                const resolvedYpx = clampedLocalYmm * scale;

                node.position({
                  x: resolvedXpx,
                  y: resolvedYpx,
                });

                if (onPlacementMove) {
                  onPlacementMove(placement.id, {
                    x: clampedLocalXmm + room.origin.x,
                    y: clampedLocalYmm + room.origin.y,
                  });
                }
              }}
              onMouseDown={() => {
                if (onPlacementSelect) {
                  onPlacementSelect(placement.id);
                }
              }}
              onTap={() => {
                if (onPlacementSelect) {
                  onPlacementSelect(placement.id);
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={widthPx}
                height={depthPx}
                cornerRadius={8}
                fill={doorColor}
                shadowColor="#000000"
                shadowBlur={isSelected ? 16 : 4}
                shadowOpacity={0.35}
              />
              {shouldRenderTop
                ? topImage && topMaterial
                  ? (
                    <Rect
                      x={0}
                      y={0}
                      width={widthPx}
                      height={depthPx}
                      cornerRadius={8}
                      fillPatternImage={topImage}
                      fillPatternRepeat="repeat"
                      fillPatternScaleX={topMaterial.repeatUV?.[0] ?? 1}
                      fillPatternScaleY={topMaterial.repeatUV?.[1] ?? 1}
                      opacity={0.82}
                    />
                  )
                  : (
                    <Rect
                      x={0}
                      y={0}
                      width={widthPx}
                      height={depthPx}
                      cornerRadius={8}
                      fill={DEFAULT_TOP_COLOR}
                      opacity={0.2}
                    />
                  )
                : null}
              <Rect
                x={0}
                y={0}
                width={widthPx}
                height={depthPx}
                cornerRadius={8}
                stroke={isSelected ? "#FACC15" : "#1f2230"}
                strokeWidth={isSelected ? 3 : 1.5}
              />
              <Text
                x={MODULE_LABEL_PADDING}
                y={MODULE_LABEL_PADDING}
                width={widthPx - MODULE_LABEL_PADDING * 2}
                text={module.label}
                fill="#ffffff"
                fontStyle="600"
                fontSize={14}
                align="left"
                listening={false}
              />
              <Text
                x={MODULE_LABEL_PADDING}
                y={MODULE_LABEL_PADDING + 18}
                width={widthPx - MODULE_LABEL_PADDING * 2}
                text={`${module.width}×${module.depth}mm`}
                fill="#d1d5db"
                fontSize={12}
                listening={false}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}

export type { LayoutRoom };

