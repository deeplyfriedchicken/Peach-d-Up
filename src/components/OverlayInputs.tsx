import React from "react";

interface OverlayInputsProps {
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayAspect: number;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (width: number, height: number) => void;
}

export const OverlayInputs: React.FC<OverlayInputsProps> = ({
  overlayX,
  overlayY,
  overlayWidth,
  overlayHeight,
  overlayAspect,
  onPositionChange,
  onSizeChange,
}) => {
  const alignH = (align: "left" | "center" | "right") => {
    const x = align === "left" ? 0 : align === "right" ? 100 - overlayWidth : (100 - overlayWidth) / 2;
    onPositionChange(Math.max(0, x), overlayY);
  };

  const alignV = (align: "top" | "middle" | "bottom") => {
    const y = align === "top" ? 0 : align === "bottom" ? 100 - overlayHeight : (100 - overlayHeight) / 2;
    onPositionChange(overlayX, Math.max(0, y));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={sectionLabel}>Position</label>
      <div style={row}>
        <InputField
          label="X"
          value={overlayX}
          onChange={(v) => onPositionChange(v, overlayY)}
        />
        <InputField
          label="Y"
          value={overlayY}
          onChange={(v) => onPositionChange(overlayX, v)}
        />
      </div>

      <label style={sectionLabel}>Align</label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          <AlignButton label="L" title="Align left" onClick={() => alignH("left")} />
          <AlignButton label="C" title="Center horizontally" onClick={() => alignH("center")} />
          <AlignButton label="R" title="Align right" onClick={() => alignH("right")} />
        </div>
        <div style={{ width: 1, background: "#333" }} />
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          <AlignButton label="T" title="Align top" onClick={() => alignV("top")} />
          <AlignButton label="M" title="Center vertically" onClick={() => alignV("middle")} />
          <AlignButton label="B" title="Align bottom" onClick={() => alignV("bottom")} />
        </div>
      </div>

      <label style={sectionLabel}>Size</label>
      <div style={row}>
        <InputField
          label="W"
          value={overlayWidth}
          onChange={(v) => onSizeChange(v, v * overlayAspect)}
        />
        <InputField
          label="H"
          value={overlayHeight}
          onChange={(v) => onSizeChange(v / overlayAspect, v)}
        />
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ fontSize: 12, color: "#888", fontWeight: 600, width: 16 }}>{label}</span>
    <input
      type="number"
      step={0.5}
      min={0}
      max={100}
      value={parseFloat(value.toFixed(1))}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(Math.max(0, Math.min(100, v)));
      }}
      style={inputStyle}
    />
    <span style={{ fontSize: 11, color: "#666" }}>%</span>
  </div>
);

const AlignButton: React.FC<{
  label: string;
  title: string;
  onClick: () => void;
}> = ({ label, title, onClick }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      flex: 1,
      padding: "6px 0",
      background: "#2a2a2a",
      border: "1px solid #444",
      borderRadius: 6,
      color: "#ccc",
      cursor: "pointer",
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1,
    }}
  >
    {label}
  </button>
);

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 8px",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 6,
  color: "#eee",
  fontSize: 13,
  width: 0,
};
