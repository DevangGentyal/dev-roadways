"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SUPPORTED_LANGUAGES, Language } from "@/lib/i18n/types";

export function LanguageSelector({
  variant = "select",
  className = "",
}: {
  variant?: "select" | "pills";
  className?: string;
}) {
  const { language, setLanguage } = useLanguage();

  if (variant === "pills") {
    return (
      <div
        className={`language-pills-container ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 8,
          padding: 2,
          gap: 2,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              style={{
                border: "none",
                background: isActive ? "var(--primary, #0f172a)" : "transparent",
                color: isActive ? "#ffffff" : "var(--ink, #334155)",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`language-selector-wrapper ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        borderRadius: 8,
        padding: "5px 9px",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--ink, #0f172a)",
        cursor: "pointer",
      }}
    >
      <Languages size={17} style={{ color: "var(--primary, #2563eb)", flexShrink: 0 }} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select Language"
        style={{
          border: "none",
          background: "transparent",
          fontSize: 13,
          fontWeight: 600,
          color: "inherit",
          cursor: "pointer",
          outline: "none",
          paddingRight: 2,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
