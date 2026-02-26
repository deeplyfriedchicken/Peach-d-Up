import React, { useRef, useCallback } from "react";
import { Rnd } from "react-rnd";

interface OverlayEditorProps {
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlaySrc: string | null;
  visible: boolean;
  opacity: number;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (width: number, height: number) => void;
}

export const OverlayEditor: React.FC<OverlayEditorProps> = ({
  overlayX,
  overlayY,
  overlayWidth,
  overlayHeight,
  overlaySrc,
  visible,
  opacity,
  onPositionChange,
  onSizeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { w: 1, h: 1 };
    const rect = containerRef.current.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }, []);

  const { w, h } = containerRef.current
    ? { w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight }
    : { w: 800, h: 450 };

  const hidden = !overlaySrc || !visible;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: hidden ? 0 : opacity,
        visibility: hidden ? "hidden" : "visible",
      }}
    >
      <Rnd
        position={{
          x: (overlayX / 100) * w,
          y: (overlayY / 100) * h,
        }}
        size={{
          width: (overlayWidth / 100) * w,
          height: (overlayHeight / 100) * h,
        }}
        lockAspectRatio
        onDragStop={(_e, d) => {
          const container = getContainerSize();
          onPositionChange(
            (d.x / container.w) * 100,
            (d.y / container.h) * 100
          );
        }}
        onResizeStop={(_e, _dir, ref, _delta, position) => {
          const container = getContainerSize();
          onSizeChange(
            (ref.offsetWidth / container.w) * 100,
            (ref.offsetHeight / container.h) * 100
          );
          onPositionChange(
            (position.x / container.w) * 100,
            (position.y / container.h) * 100
          );
        }}
        bounds="parent"
        style={{
          pointerEvents: "auto",
          border: "2px dashed rgba(255, 92, 42, 0.8)",
          borderRadius: 4,
        }}
      >
        <img
          src={overlaySrc}
          alt="overlay"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </Rnd>
    </div>
  );
};
