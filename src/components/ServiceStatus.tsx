import { useState, useEffect, useCallback } from "react";

interface Status {
  claude: boolean;
  claudeModel: string;
  higgsfield: boolean;
}

interface ServiceStatusProps {
  compact?: boolean;
}

export function ServiceStatus({ compact = false }: ServiceStatusProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch("/api/status");
      const data = await r.json();
      setStatus(data);
    } catch {
      setStatus({ claude: false, claudeModel: "", higgsfield: false });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [check]);

  if (!status && !checking) return null;

  const modelLabel = status?.claudeModel ? "4.6" : "";

  const claudeTitle = checking
    ? "Checking Claude…"
    : status?.claude
    ? "Claude Sonnet 4.6 — live"
    : "Claude — unavailable (check API key)";

  const hfTitle = checking
    ? "Checking Higgsfield…"
    : status?.higgsfield
    ? "Higgsfield — live"
    : "Higgsfield — unavailable (check API credentials)";

  /* ── Compact sidebar mode: two icon-buttons stacked ── */
  if (compact) {
    return (
      <div className="flex md:flex-col items-center gap-2">
        {/* Claude */}
        <button
          onClick={check}
          title={claudeTitle}
          className={`group relative w-9 h-9 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none ${
            checking
              ? "border-white/10 bg-white/5 animate-pulse"
              : status?.claude
              ? "border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15"
              : "border-red-500/30 bg-red-500/8 hover:bg-red-500/15"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            checking ? "bg-slate-600" : status?.claude ? "bg-emerald-500" : "bg-red-500"
          }`} />
          <span className="text-[7px] font-mono font-bold text-slate-500 leading-none">C{modelLabel}</span>
          {/* tooltip */}
          <span className="absolute left-11 top-1/2 -translate-y-1/2 px-2 py-1 bg-black border border-white/10 text-[9px] font-mono uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 rounded shadow-md pointer-events-none">
            {claudeTitle}
          </span>
        </button>

        {/* Higgsfield */}
        <button
          onClick={check}
          title={hfTitle}
          className={`group relative w-9 h-9 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none ${
            checking
              ? "border-white/10 bg-white/5 animate-pulse"
              : status?.higgsfield
              ? "border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15"
              : "border-red-500/30 bg-red-500/8 hover:bg-red-500/15"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            checking ? "bg-slate-600" : status?.higgsfield ? "bg-emerald-500" : "bg-red-500"
          }`} />
          <span className="text-[7px] font-mono font-bold text-slate-500 leading-none">HF</span>
          {/* tooltip */}
          <span className="absolute left-11 top-1/2 -translate-y-1/2 px-2 py-1 bg-black border border-white/10 text-[9px] font-mono uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 rounded shadow-md pointer-events-none">
            {hfTitle}
          </span>
        </button>
      </div>
    );
  }

  /* ── Default pill mode (kept for fallback use) ── */
  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <button
        onClick={check}
        title={claudeTitle}
        className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer select-none ${
          checking
            ? "border-white/10 bg-white/3 text-slate-600 animate-pulse"
            : status?.claude
            ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-500 hover:bg-emerald-500/15"
            : "border-red-500/30 bg-red-500/8 text-red-500 hover:bg-red-500/15"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${
          checking ? "bg-slate-600" : status?.claude ? "bg-emerald-500" : "bg-red-500"
        }`} />
        <span>Claude{modelLabel ? ` ${modelLabel}` : ""}</span>
      </button>

      <button
        onClick={check}
        title={hfTitle}
        className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer select-none ${
          checking
            ? "border-white/10 bg-white/3 text-slate-600 animate-pulse"
            : status?.higgsfield
            ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-500 hover:bg-emerald-500/15"
            : "border-red-500/30 bg-red-500/8 text-red-500 hover:bg-red-500/15"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${
          checking ? "bg-slate-600" : status?.higgsfield ? "bg-emerald-500" : "bg-red-500"
        }`} />
        <span>HF</span>
      </button>
    </div>
  );
}
