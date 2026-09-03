import type { ReactNode } from "react";

type EmptyKind = "plan" | "results" | "reports" | "monitor";

function PlanArt() {
  return (
    <svg viewBox="0 0 200 148" className="h-auto w-full" fill="none" aria-hidden>
      <rect x="22" y="18" width="156" height="112" rx="22" fill="#F4F6FF" />
      <rect x="38" y="34" width="124" height="28" rx="10" fill="white" />
      <circle cx="54" cy="48" r="7" fill="#D7DCF8" />
      <path d="M51 48.2 53.1 50.4 57.4 45.8" stroke="#161FAD" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="66" y="43" width="78" height="6" rx="3" fill="#E4E8F6" />
      <rect x="66" y="53" width="46" height="4" rx="2" fill="#EEF1FA" />
      <rect x="38" y="70" width="124" height="28" rx="10" fill="white" />
      <circle cx="54" cy="84" r="7" fill="#E8EBFA" />
      <rect x="66" y="79" width="70" height="6" rx="3" fill="#E4E8F6" />
      <rect x="66" y="89" width="38" height="4" rx="2" fill="#EEF1FA" />
      <rect x="38" y="106" width="88" height="10" rx="5" fill="#E8EBFA" />
    </svg>
  );
}

function ResultsArt() {
  return (
    <svg viewBox="0 0 200 148" className="h-auto w-full" fill="none" aria-hidden>
      <rect x="28" y="46" width="92" height="72" rx="16" fill="#F4F6FF" />
      <path d="M44 46h28l8 10h40a12 12 0 0 1 12 12v50a16 16 0 0 1-16 16H44a16 16 0 0 1-16-16V62a16 16 0 0 1 16-16Z" fill="#E7EBFA" />
      <rect x="96" y="30" width="76" height="88" rx="16" fill="white" stroke="#E4E8F6" />
      <rect x="110" y="46" width="48" height="6" rx="3" fill="#D7DCF8" />
      <rect x="110" y="60" width="36" height="5" rx="2.5" fill="#EEF1FA" />
      <rect x="110" y="72" width="42" height="5" rx="2.5" fill="#EEF1FA" />
      <rect x="110" y="90" width="28" height="12" rx="6" fill="#161FAD" opacity="0.12" />
    </svg>
  );
}

function ReportsArt() {
  return (
    <svg viewBox="0 0 200 148" className="h-auto w-full" fill="none" aria-hidden>
      <rect x="48" y="20" width="104" height="112" rx="16" fill="white" stroke="#E4E8F6" />
      <rect x="64" y="36" width="52" height="8" rx="4" fill="#161FAD" opacity="0.16" />
      <rect x="64" y="52" width="72" height="5" rx="2.5" fill="#E4E8F6" />
      <rect x="64" y="64" width="64" height="5" rx="2.5" fill="#EEF1FA" />
      <rect x="64" y="76" width="70" height="5" rx="2.5" fill="#EEF1FA" />
      <rect x="64" y="96" width="20" height="22" rx="4" fill="#D7DCF8" />
      <rect x="90" y="88" width="20" height="30" rx="4" fill="#161FAD" opacity="0.18" />
      <rect x="116" y="102" width="20" height="16" rx="4" fill="#E8EBFA" />
    </svg>
  );
}

function MonitorArt() {
  return (
    <svg viewBox="0 0 200 148" className="h-auto w-full" fill="none" aria-hidden>
      <rect x="26" y="24" width="148" height="92" rx="18" fill="#F4F6FF" />
      <rect x="40" y="38" width="120" height="64" rx="12" fill="white" />
      <circle cx="52" cy="50" r="4" fill="#F59E8B" />
      <circle cx="64" cy="50" r="4" fill="#F5D48B" />
      <circle cx="76" cy="50" r="4" fill="#9BD4B5" />
      <path d="M50 82c10-14 18-8 26-16s14-4 22-12 16 2 28 8" stroke="#161FAD" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="78" y="118" width="44" height="8" rx="4" fill="#E4E8F6" />
    </svg>
  );
}

const art: Record<EmptyKind, () => ReactNode> = {
  plan: PlanArt,
  results: ResultsArt,
  reports: ReportsArt,
  monitor: MonitorArt,
};

export function SidePanelEmptyState({
  kind,
  title,
}: {
  kind: EmptyKind;
  title: string;
}) {
  const Illustration = art[kind];

  return (
    <div
      data-testid={`side-empty-${kind}`}
      className="flex min-h-[360px] flex-col items-center justify-center px-2 py-8 text-center"
    >
      <div className="w-[200px]">
        <Illustration />
      </div>
      <h3 className="mt-4 text-[14px] font-medium text-slate-500">{title}</h3>
    </div>
  );
}
