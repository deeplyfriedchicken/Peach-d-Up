import React from "react";

interface TabBarProps {
  activeTab: "overlay" | "summary";
  onTabChange: (tab: "overlay" | "summary") => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "overlay" as const, label: "Overlay" },
    { key: "summary" as const, label: "Summary" },
  ];

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: activeTab === tab.key ? "#FF5C2A" : "#2a2a2a",
            border: "none",
            borderRadius: 8,
            color: activeTab === tab.key ? "#fff" : "#999",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
