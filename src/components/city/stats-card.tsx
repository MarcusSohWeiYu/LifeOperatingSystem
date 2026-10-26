"use client";
import { useRouter } from "next/navigation";
import { Html } from "@react-three/drei";
import { useTheme } from "next-themes";
import type { SelectedBuilding } from "./city-types";
import { formatSGD } from "@/lib/finance/money";

type Props = {
  pos: [number, number, number];
  building: SelectedBuilding;
  onClose: () => void;
};

const HEALTH_LABELS: Record<string, string> = {
  reached: "Reached",
  "on-track": "On track",
  behind: "Behind",
  overdue: "Overdue",
};

const HEALTH_COLORS: Record<string, string> = {
  reached: "#22c55e",
  "on-track": "#3b82f6",
  behind: "#f59e0b",
  overdue: "#ef4444",
};

export function StatsCard({ pos, building, onClose }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const bg = dark ? "rgba(20,20,30,0.85)" : "rgba(255,255,255,0.82)";
  const border = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const textColor = dark ? "#f0f0f0" : "#111111";
  const mutedColor = dark ? "#a0a0b0" : "#666677";

  const cardStyle: React.CSSProperties = {
    background: bg,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${border}`,
    borderRadius: "14px",
    padding: "14px 16px",
    minWidth: "180px",
    maxWidth: "220px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    color: textColor,
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: "1.4",
    userSelect: "none",
    cursor: "default",
    pointerEvents: "auto",
  };

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  let title = "";
  let href = "/finance";
  let content: React.ReactNode = null;

  if (building.kind === "income") {
    const b = building.building;
    title = b.name;
    href = "/finance/income";
    content = (
      <p style={{ color: mutedColor, fontSize: "12px", marginTop: "4px" }}>
        {formatSGD(b.monthlyCents)}/mo · income
      </p>
    );
  } else if (building.kind === "subscription") {
    const s = building.shop;
    title = s.name;
    href = "/finance/subscriptions";
    content = (
      <>
        <p style={{ color: mutedColor, fontSize: "12px", marginTop: "4px" }}>
          {formatSGD(s.monthlyCents)}/mo · {s.category}
        </p>
        {s.renewingSoon && (
          <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px" }}>
            Renewing soon
          </p>
        )}
      </>
    );
  } else if (building.kind === "budget") {
    const b = building.building;
    title = b.category;
    href = "/finance/budget";
    content = (
      <>
        <p style={{ color: mutedColor, fontSize: "12px", marginTop: "4px", textTransform: "capitalize" }}>
          {b.type} · {formatSGD(b.plannedMonthlyCents)}/mo
        </p>
      </>
    );
  } else if (building.kind === "goal") {
    const g = building.site;
    title = g.name;
    href = `/finance/goals/${g.id}`;
    const pct = Math.round(g.progress);
    const healthColor = HEALTH_COLORS[g.health] ?? "#888888";
    const healthLabel = HEALTH_LABELS[g.health] ?? g.health;
    content = (
      <>
        <div style={{ margin: "6px 0 4px", background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: healthColor, borderRadius: "4px", transition: "width 0.3s" }} />
        </div>
        <p style={{ color: mutedColor, fontSize: "12px" }}>
          {formatSGD(g.savedCents)} / {formatSGD(g.targetCents)}
        </p>
        <p style={{ fontSize: "11px", marginTop: "3px" }}>
          <span style={{ color: healthColor, fontWeight: 600 }}>{healthLabel}</span>
          {g.months > 0 && <span style={{ color: mutedColor }}> · {g.months}mo left</span>}
        </p>
      </>
    );
  } else if (building.kind === "gym") {
    title = "Fitness · Nutrition";
    href = "/fitness/nutrition";
    const pct = building.target > 0 ? Math.round((building.calories / building.target) * 100) : 0;
    content = (
      <>
        <p style={{ color: mutedColor, fontSize: "12px", marginTop: "4px" }}>
          {building.calories} / {building.target} kcal ({pct}%)
        </p>
        <p style={{ color: mutedColor, fontSize: "12px" }}>
          {building.proteinG}g protein
        </p>
      </>
    );
  }

  return (
    <Html
      position={pos}
      center
      distanceFactor={10}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>{title}</p>
        {content}
        <button
          onClick={() => navigate(href)}
          style={{
            marginTop: "10px",
            width: "100%",
            background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
            border: "none",
            borderRadius: "8px",
            padding: "6px 10px",
            fontSize: "12px",
            color: textColor,
            cursor: "pointer",
            fontWeight: 500,
            pointerEvents: "auto",
          }}
        >
          View details →
        </button>
      </div>
    </Html>
  );
}
