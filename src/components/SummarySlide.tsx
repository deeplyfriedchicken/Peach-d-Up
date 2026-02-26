import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export interface SummarySlideProps {
  items: Array<{ id: string; emoji: string; text: string }>;
}

export const SummarySlide: React.FC<SummarySlideProps> = ({ items }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 40,
          padding: 80,
          width: "100%",
          maxWidth: 1200,
        }}
      >
        {items.map((item, index) => {
          const delay = index * 10;
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(frame, [delay, delay + 15], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              <span style={{ fontSize: 64, lineHeight: 1 }}>
                {item.emoji}
              </span>
              <span
                style={{
                  fontSize: 48,
                  color: "#ffffff",
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontWeight: 600,
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
