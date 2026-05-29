import { useState } from "react";
import { Palette, Copy, Check } from "lucide-react";
import type { StylePreset, StyleLayer } from "../types";

interface StylePresetPanelProps {
  preset: StylePreset;
}

const LAYER_CONFIG = {
  core_identity: {
    pct: "60%",
    barColor: "bg-orange-500",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-950/15",
    dotColor: "bg-orange-500",
  },
  secondary_influence: {
    pct: "30%",
    barColor: "bg-violet-500",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-950/15",
    dotColor: "bg-violet-500",
  },
  accent_layer: {
    pct: "10%",
    barColor: "bg-cyan-500",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-950/15",
    dotColor: "bg-cyan-500",
  },
} as const;

function LayerCard({
  layer,
  configKey,
}: {
  layer: StyleLayer;
  configKey: keyof typeof LAYER_CONFIG;
}) {
  const cfg = LAYER_CONFIG[configKey];
  return (
    <div className={`rounded-xl border ${cfg.borderColor} ${cfg.bgColor} p-3 space-y-2`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[11px] font-black ${cfg.textColor}`}>{cfg.pct}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">{layer.label}</span>
        </div>
        {/* Weight bar */}
        <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className={`${cfg.barColor} h-full rounded-full`} style={{ width: cfg.pct }} />
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-slate-400 leading-snug italic">{layer.description}</p>

      {/* Elements */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {layer.elements.map((el, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.borderColor} bg-black/40 text-slate-300`}
          >
            <span className={`w-1 h-1 rounded-full shrink-0 ${cfg.dotColor}`} />
            {el}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StylePresetPanel({ preset }: StylePresetPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fingerprint = `60% ${preset.core_identity.label} | 30% ${preset.secondary_influence.label} | 10% ${preset.accent_layer.label}`;

  const handleCopy = () => {
    const allElements = [
      ...preset.core_identity.elements,
      ...preset.secondary_influence.elements,
      ...preset.accent_layer.elements,
    ].join(", ");
    navigator.clipboard.writeText(`[STYLE PRESET: ${preset.title}] ${allElements}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
          expanded ? "bg-white/8 hover:bg-white/10" : "hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <Palette className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <div>
            <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase font-bold block">
              Style Preset — 60 / 30 / 10
            </span>
            <span className="text-white font-semibold text-sm">{preset.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Weight bar preview */}
          <div className="hidden sm:flex items-center gap-0.5 w-20 h-2 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full" style={{ width: "60%" }} />
            <div className="bg-violet-500 h-full" style={{ width: "30%" }} />
            <div className="bg-cyan-500 h-full"   style={{ width: "10%" }} />
          </div>
          <span className="font-mono text-[9px] font-bold text-slate-400">
            {expanded ? "[ Hide ]" : "[ Expand ]"}
          </span>
        </div>
      </button>

      {/* Fingerprint strip — always visible */}
      <div className="px-4 pb-3 flex items-center justify-between gap-3 border-b border-white/8">
        <span className="font-mono text-[8px] text-slate-500 tracking-wider truncate">{fingerprint}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Expanded layers */}
      {expanded && (
        <div className="p-4 space-y-3">
          <LayerCard layer={preset.core_identity}       configKey="core_identity" />
          <LayerCard layer={preset.secondary_influence} configKey="secondary_influence" />
          <LayerCard layer={preset.accent_layer}        configKey="accent_layer" />
        </div>
      )}
    </div>
  );
}
