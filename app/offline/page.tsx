"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fd 100%)",
        color: "#0f172a",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          padding: "28px 22px",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          background: "rgba(255,255,255,0.88)",
          boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <LanguageSelector />
        </div>
        <div
          style={{
            width: 68,
            height: 68,
            margin: "0 auto 16px",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            position: "relative",
          }}
        >
          <Image
            src="/icon.svg"
            alt={t("common.appName", undefined, "Dev Roadways")}
            fill
            priority
            style={{ objectFit: "cover", transform: "scale(1.18)" }}
          />
        </div>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.03em" }}>
          {t("offline.title", undefined, "You are offline")}
        </h1>
        <p style={{ margin: "10px 0 0", color: "#64748b", lineHeight: 1.6 }}>
          {t(
            "offline.desc",
            undefined,
            "Dev Roadways is ready to open again as soon as your connection comes back. Business data stays live and will sync from the server when available."
          )}
        </p>
      </div>
    </div>
  );
}
