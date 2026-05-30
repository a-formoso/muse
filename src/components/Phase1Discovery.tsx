import { useState, useEffect, useRef } from "react";
import { StoryOption, Character } from "../types";
import { PRESEEDED_OPTIONS } from "../preseededData";
import { getAuthHeader } from "../lib/authHeader";
import {
  Sparkles, ArrowRight, Edit3, CheckCircle, Volume2,
  Fingerprint, Sliders, Copy, ChevronLeft, ChevronRight, Loader2, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStorySetting, getStoryMeaning, getStoryCharacters, getCharacterRoster } from "../utils/schemaConverter";

interface Phase1DiscoveryProps {
  onSelectOption: (option: StoryOption) => void;
  onLockOption: (option: StoryOption) => void;
  selectedOptionId?: number;
  lockedOptionId?: number;
  /** All previously-generated options to hydrate from (resume/reload). */
  initialOptions?: StoryOption[];
  /** Push the full option set up so the parent can persist every generated option. */
  onOptionsChange?: (options: StoryOption[]) => void;
}

export function Phase1Discovery({ onSelectOption, onLockOption, selectedOptionId, lockedOptionId, initialOptions, onOptionsChange }: Phase1DiscoveryProps) {
  const [premise, setPremise] = useState(
    "What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?"
  );
  const [isEditingPremise, setIsEditingPremise] = useState(false);
  const OPTION_IDS = [1, 2, 3];
  // Hydrate from persisted options when resuming; otherwise start with the preseeded Option 1.
  const [options, setOptions] = useState<StoryOption[]>(() =>
    initialOptions && initialOptions.length
      ? initialOptions.map((o, i) => ({ ...o, option_id: o.option_id ?? i + 1 }))
      : [{ ...PRESEEDED_OPTIONS[0], option_id: 1 }]
  );
  const [activeOptionId, setActiveOptionId] = useState<number>(selectedOptionId || 1);
  const [loadingOptionId, setLoadingOptionId] = useState<number | null>(null);
  const [loadingCharId, setLoadingCharId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const [playingMonologueCharId, setPlayingMonologueCharId] = useState<string | null>(null);
  const [expandedVisualsCharId, setExpandedVisualsCharId] = useState<string | null>(null);
  const [expandedMonologueCharId, setExpandedMonologueCharId] = useState<string | null>(null);
  const [expandedKineticsCharId, setExpandedKineticsCharId] = useState<string | null>(null);
  const [expandedPsychCharId, setExpandedPsychCharId] = useState<string | null>(null);
  const [propsExpanded, setPropsExpanded] = useState(false);
  const [copiedCharId, setCopiedCharId] = useState<string | null>(null);
  const [activeCharIndex, setActiveCharIndex] = useState<number>(0);
  const [leftTab, setLeftTab] = useState<"env" | "dialectic">("env");

  useEffect(() => {
    if (selectedOptionId) setActiveOptionId(selectedOptionId);
  }, [selectedOptionId]);

  // Persist the full option set whenever it changes — but skip the initial hydration
  // render so we don't redundantly re-save freshly-resumed data.
  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (!didHydrateRef.current) { didHydrateRef.current = true; return; }
    onOptionsChange?.(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // On option switch, land on the first ALREADY-GENERATED character (so returning to
  // an option shows the full profile you built, not a stub) — falling back to index 0.
  useEffect(() => {
    const o = options.find((x) => x.option_id === activeOptionId);
    const r = o ? getCharacterRoster(o) : [];
    const generated = o ? getStoryCharacters(o) : [];
    const firstGenIdx = r.findIndex((s) => generated.some((c) => c.id === s.id));
    setActiveCharIndex(firstGenIdx >= 0 ? firstGenIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOptionId]);

  // Generate ONE option on demand (Option 1 by default; Options 2 & 3 when the
  // user clicks their tab). One option per request stays under the rate limit
  // while keeping the full schema. The current view stays put until it's ready.
  const handleGenerateOption = async (targetId: number) => {
    if (loadingOptionId !== null) return;
    setLoadingOptionId(targetId);
    setErrorInfo(null);
    try {
      const resp = await fetch("/api/phase1-spine", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
        body: JSON.stringify({ customizedPremise: premise, optionIndex: targetId - 1 }),
      });
      const data = await resp.json();
      if (data.success && data.spine) {
        const newOpt: StoryOption = { ...data.spine, option_id: targetId };
        setOptions((prev) => {
          const others = prev.filter((o) => o.option_id !== targetId);
          return [...others, newOpt].sort((a, b) => a.option_id - b.option_id);
        });
        setActiveOptionId(targetId);
        setActiveCharIndex(0);
        onSelectOption(newOpt);
      } else {
        setErrorInfo(data.message || "Failed to generate this direction.");
      }
    } catch {
      setErrorInfo("Could not connect to the server. Ensure it is active and secrets are loaded.");
    } finally {
      setLoadingOptionId(null);
    }
  };

  // Generate ONE full character bible on demand and merge it into the active option.
  const handleGenerateCharacter = async (characterId: string) => {
    if (loadingCharId !== null) return;
    const targetOpt = options.find((o) => o.option_id === activeOptionId);
    if (!targetOpt) return;
    setLoadingCharId(characterId);
    setErrorInfo(null);
    try {
      const resp = await fetch("/api/phase1-character", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
        body: JSON.stringify({ premise, optionIndex: targetOpt.option_id - 1, spine: targetOpt, characterId }),
      });
      const data = await resp.json();
      if (data.success && data.character) {
        const fullChar: Character = { ...data.character, id: characterId, _generated: true };
        const others = (targetOpt.characters || []).filter((c) => c.id !== characterId);
        const merged: StoryOption = { ...targetOpt, characters: [...others, fullChar] };
        setOptions((prev) => prev.map((o) => (o.option_id === merged.option_id ? merged : o)));
        onSelectOption(merged);
      } else {
        setErrorInfo(data.message || "Failed to generate this character.");
      }
    } catch {
      setErrorInfo("Could not connect to the server. Ensure it is active and secrets are loaded.");
    } finally {
      setLoadingCharId(null);
    }
  };

  const opt = options.find((o) => o.option_id === activeOptionId) || options[0];
  if (!opt) return null;
  const isSelected = lockedOptionId === opt.option_id;
  const setting = getStorySetting(opt);
  const meaning = getStoryMeaning(opt);
  const characters = getStoryCharacters(opt);
  const roster = getCharacterRoster(opt);
  const activeStub = roster[activeCharIndex] || roster[0];
  const char = activeStub
    ? characters.find((c) => c.id === activeStub.id)
    : characters[activeCharIndex] || characters[0];

  return (
    <div className="space-y-4">

      {/* ── Premise Row ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase font-bold">Story Setup</span>
            <h2 className="text-base font-semibold text-white mt-0.5">Your Story Idea</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditingPremise(!isEditingPremise)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 font-mono font-medium transition-all cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              {isEditingPremise ? "Lock" : "Customize"}
            </button>
            <button
              onClick={() => handleGenerateOption(activeOptionId)}
              disabled={loadingOptionId !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-[11px] text-white font-mono font-bold transition-all cursor-pointer shadow-md shadow-orange-950/40"
            >
              {loadingOptionId === activeOptionId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {loadingOptionId === activeOptionId ? "Consulting AI…" : `Re-generate Option 0${activeOptionId}`}
            </button>
          </div>
        </div>

        {isEditingPremise ? (
          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            className="w-full h-16 p-2.5 bg-black/80 border border-orange-500/40 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
          />
        ) : (
          <p className="text-slate-200 text-xs leading-relaxed italic border-l-2 border-orange-500 pl-3">
            "{premise}"
          </p>
        )}

        {errorInfo && (
          <div className="mt-3 p-2.5 rounded-lg border border-yellow-700/40 bg-yellow-950/30 text-yellow-400 text-[11px]">
            <strong>Notice:</strong> {errorInfo}
          </div>
        )}
      </div>

      {/* ── Option Selector Row ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-sans text-sm font-semibold text-white">Story Directions</h3>
          <p className="font-sans text-[11px] text-slate-400 mt-0.5">Pick a direction below, then lock it in to continue.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          {OPTION_IDS.map((id) => {
            const existing = options.find((o) => o.option_id === id);
            const isActive = activeOptionId === id && !!existing;
            const isSel = selectedOptionId === id;
            const isGenerating = loadingOptionId === id;
            // Sequential unlock: a not-yet-generated option can only be generated once
            // the previous one exists (Option 1 is always the preseeded default).
            const prevExists = id === 1 || options.some((o) => o.option_id === id - 1);
            const locked = !existing && !prevExists;
            return (
              <button
                key={id}
                disabled={loadingOptionId !== null || locked}
                onClick={() => {
                  if (existing) { setActiveOptionId(id); onSelectOption(existing); }
                  else if (!locked) { handleGenerateOption(id); }
                }}
                title={
                  existing ? `View Option 0${id}`
                  : locked ? `Generate Option 0${id - 1} first`
                  : `Generate a new direction for Option 0${id}`
                }
                className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-60 ${
                  locked ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md"
                    : existing
                    ? "text-slate-300 hover:text-white hover:bg-white/8"
                    : locked
                    ? "text-slate-600 border border-dashed border-white/10"
                    : "text-slate-500 border border-dashed border-white/15 hover:text-white hover:bg-white/5"
                }`}
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" />
                  : locked ? <Lock className="w-3 h-3" />
                  : (!existing && <Sparkles className="w-3 h-3" />)}
                Option 0{id}
                {isSel && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Option Card ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={opt.option_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-orange-500/70 p-4 bg-gradient-to-br from-[#0c0c10] to-[#08080a] shadow-2xl"
        >
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/15 text-slate-300">
                Option 0{opt.option_id}
              </span>
              {isSelected && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase">
                  <CheckCircle className="w-3 h-3" /> Selected
                </span>
              )}
              <h4 className="font-sans text-lg font-bold text-white tracking-tight">{opt.title}</h4>
            </div>

            {/* ── Primary CTA ── */}
            <button
              onClick={() => onLockOption(opt)}
              className={`flex items-center gap-2 py-2 px-5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md ${
                isSelected
                  ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40"
                  : "bg-orange-600/15 hover:bg-orange-600/30 border border-orange-500/60 hover:border-orange-400 text-orange-300 hover:text-white"
              }`}
            >
              {isSelected ? "Locked — Continue to Phase 2" : "Select This Direction"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Two-column body ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* LEFT: Tabbed story info */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Tabs */}
              <div className="flex border border-white/15 rounded-lg overflow-hidden bg-black/50">
                {(["env", "dialectic"] as const).map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setLeftTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      i > 0 ? "border-l border-white/10" : ""
                    } ${
                      leftTab === tab
                        ? "bg-white/15 text-white"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab === "env" ? "Setting" : "Meaning"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {leftTab === "env" ? (
                  <motion.div
                    key="env"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
                  >
                    <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase font-bold block">World & Setting</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Time Period</span>
                        <span className="text-white text-[11px] font-medium">{setting.dimensions.period}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Duration</span>
                        <span className="text-white text-[11px] font-medium">{setting.dimensions.duration}</span>
                      </div>
                      <div className="col-span-2 border-t border-white/8 pt-2.5">
                        <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Location</span>
                        <span className="text-white text-[11px] font-medium">{setting.dimensions.location}</span>
                      </div>
                      <div className="col-span-2 border-t border-white/8 pt-2.5">
                        <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Main Conflict</span>
                        <span className="text-slate-200 text-[11px]">{setting.dimensions.conflict_level}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dialectic"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
                  >
                    <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase font-bold block">Core Message</span>
                    <p className="text-white font-medium italic leading-relaxed text-[11px]">
                      "{meaning.controlling_idea}"
                    </p>
                    <div className="bg-black/50 p-3 rounded-lg text-[11px] font-mono space-y-2 border border-white/8">
                      <div>
                        <span className="text-emerald-400 font-bold block text-[9px] mb-0.5 uppercase tracking-wider">+ The Argument For</span>
                        <p className="text-slate-200">{meaning.dialectical_debate.positive_idea}</p>
                      </div>
                      <div className="border-t border-white/8 pt-2">
                        <span className="text-red-400 font-bold block text-[9px] mb-0.5 uppercase tracking-wider">− The Argument Against</span>
                        <p className="text-slate-200">{meaning.dialectical_debate.negative_counter_idea}</p>
                      </div>
                    </div>

                    {meaning.props_sheet && meaning.props_sheet.length > 0 && (
                      <div className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setPropsExpanded(v => !v)}
                          className={`w-full flex items-center justify-between p-2.5 transition-colors text-left ${
                            propsExpanded ? "bg-white/15 hover:bg-white/20" : "hover:bg-white/5"
                          }`}
                        >
                          <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-200">Props</span>
                          <span className="font-mono text-[9px] font-bold text-slate-400">
                            {propsExpanded ? "[ Hide ]" : "[ Expand ]"}
                          </span>
                        </button>
                        {propsExpanded && (
                          <div className="p-3 border-t border-white/8 bg-black/50 space-y-2">
                            {meaning.props_sheet.map((prop, i) => (
                              <div key={i} className="flex items-start gap-2.5 bg-black/40 border border-white/8 rounded-lg p-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1" />
                                <div>
                                  <span className="font-mono text-[9px] font-bold text-orange-300 block mb-0.5">{prop.name}</span>
                                  <p className="text-[10px] text-slate-400 leading-snug">{prop.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Character carousel */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Section label + nav */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase font-bold">
                  Characters & Voice Settings
                </span>
                {roster.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveCharIndex((i) => Math.max(0, i - 1))}
                      disabled={activeCharIndex === 0}
                      className="p-1 rounded border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-25 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-200" />
                    </button>
                    {roster.map((c, i) => {
                      const generated = characters.some((fc) => fc.id === c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveCharIndex(i)}
                          className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            activeCharIndex === i
                              ? "bg-white/15 border-white/25 text-white"
                              : "bg-black/50 border-white/15 text-slate-300 hover:text-white hover:border-white/30"
                          }`}
                        >
                          {loadingCharId === c.id
                            ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            : generated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          {c.name || `Char ${i + 1}`}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setActiveCharIndex((i) => Math.min(roster.length - 1, i + 1))}
                      disabled={activeCharIndex === roster.length - 1}
                      className="p-1 rounded border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-25 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stub card — shown when the full bible hasn't been generated yet */}
              {!char && activeStub && (
                <div className="bg-black/50 p-4 rounded-2xl border border-dashed border-white/15 text-xs space-y-3">
                  <div className="flex justify-between items-start gap-3 pb-2.5 border-b border-white/8">
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">{activeStub.cast_orbit}</span>
                      <span className="font-bold text-white text-sm tracking-tight">{activeStub.name}</span>
                    </div>
                    <span className="shrink-0 max-w-[45%] text-right text-[9px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/15 text-slate-400 uppercase tracking-widest leading-tight">{activeStub.archetype}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{activeStub.gravity}</p>
                  <button
                    onClick={() => handleGenerateCharacter(activeStub.id)}
                    disabled={loadingCharId !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-[11px] text-white font-mono font-bold transition-all cursor-pointer"
                  >
                    {loadingCharId === activeStub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {loadingCharId === activeStub.id ? "Fleshing out character…" : "Generate full profile"}
                  </button>
                </div>
              )}

              {/* Single character card */}
              {char && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="bg-black/50 p-4 rounded-2xl border border-white/10 text-xs space-y-3"
                  >
                    {/* Character header */}
                    <div className="flex justify-between items-start gap-3 pb-2.5 border-b border-white/8">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">{char.identity.cast_orbit}</span>
                        <span className="font-bold text-white text-sm tracking-tight">{char.identity.name}</span>
                      </div>
                      <span className="shrink-0 max-w-[45%] text-right text-[9px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/15 text-slate-400 uppercase tracking-widest leading-tight">
                        {char.identity.archetype}
                      </span>
                    </div>

                    {/* Audio specs — two columns */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Casting */}
                      <div className="bg-black/40 p-3 rounded-xl border border-white/8 space-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-200 uppercase font-bold tracking-wider">
                          <Fingerprint className="w-3 h-3 text-slate-400" />
                          Voice Casting
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Voice Reference</span>
                            <span className="text-slate-100 text-[10px]">{char.audio.voice_identity.sonic_anchor}</span>
                          </div>
                          <div className="border-t border-white/8 pt-1.5">
                            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Vocal Tone</span>
                            <span className="text-slate-200 italic text-[10px]">"{char.audio.performance_styling.timbre}"</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-0.5">Speaking Pace</span>
                            <span className="text-slate-200 italic text-[10px]">{char.audio.performance_styling.tempo}</span>
                          </div>
                        </div>
                      </div>

                      {/* ElevenLabs sliders */}
                      <div className="bg-black/40 p-3 rounded-xl border border-white/8 space-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-200 uppercase font-bold tracking-wider">
                          <Sliders className="w-3 h-3 text-emerald-400" />
                          ElevenLabs Sliders
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Stability", value: char.audio.state_telemetry.neutral_state.stability, color: "bg-emerald-500", textColor: "text-emerald-400" },
                            { label: "Similarity Boost", value: char.audio.state_telemetry.neutral_state.similarity_boost, color: "bg-emerald-500", textColor: "text-emerald-400" },
                            { label: "Style Exaggeration", value: char.audio.state_telemetry.neutral_state.style_exaggeration, color: "bg-yellow-400", textColor: "text-yellow-400" },
                          ].map(({ label, value, color, textColor }) => (
                            <div key={label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-slate-400 text-[9px] font-mono">{label}</span>
                                <span className={`${textColor} font-bold text-[9px]`}>{value}%</span>
                              </div>
                              <div className="w-full bg-white/8 h-1 rounded-full overflow-hidden">
                                <div className={`${color} h-full rounded-full`} style={{ width: `${value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Monologue preview — collapsible */}
                    <div className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedMonologueCharId(expandedMonologueCharId === char.id ? null : char.id)}
                        className={`w-full flex items-center justify-between p-2.5 transition-colors text-left ${
                          expandedMonologueCharId === char.id ? "bg-white/15 hover:bg-white/20" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold tracking-wider text-slate-200">
                          <Volume2 className="w-3 h-3 text-slate-400" />
                          Worldview Monologue
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-400">
                          {expandedMonologueCharId === char.id ? "[ Hide ]" : "[ Expand ]"}
                        </span>
                      </button>
                      {expandedMonologueCharId === char.id && (
                        <div className="p-2.5 border-t border-white/8 bg-black/50 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] italic font-sans ${
                              playingMonologueCharId === char.id ? "text-white animate-pulse" : "text-slate-400"
                            }`}>
                              "{char.audio.monologue_script || "No seed worldview written yet."}"
                            </p>
                          </div>
                          <button
                            onClick={() => setPlayingMonologueCharId(playingMonologueCharId === char.id ? null : char.id)}
                            className="shrink-0 px-2.5 py-1 text-[9px] font-mono font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                            {playingMonologueCharId === char.id ? "Pause" : "Simulate"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Kinetics — collapsible */}
                    <div className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedKineticsCharId(expandedKineticsCharId === char.id ? null : char.id)}
                        className={`w-full flex items-center justify-between p-2.5 transition-colors text-left ${
                          expandedKineticsCharId === char.id ? "bg-white/15 hover:bg-white/20" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-200">Kinetics</span>
                        <span className="font-mono text-[9px] font-bold text-slate-400">
                          {expandedKineticsCharId === char.id ? "[ Hide ]" : "[ Expand ]"}
                        </span>
                      </button>
                      {expandedKineticsCharId === char.id && (
                        <div className="p-3 border-t border-white/8 bg-black/50 grid grid-cols-3 gap-2">
                          {[
                            { label: "How They Carry Themselves", value: char.kinetics.posture },
                            { label: "Nervous Habits", value: char.kinetics.gesture_vocabulary },
                            { label: "How They React", value: char.kinetics.reaction_tempo },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white/5 p-2 rounded-lg border border-white/8">
                              <span className="text-slate-500 font-mono text-[8px] uppercase tracking-wider block mb-0.5">{label}</span>
                              <span className="font-medium leading-tight text-[10px] text-slate-100">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Psychology — collapsible */}
                    <div className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedPsychCharId(expandedPsychCharId === char.id ? null : char.id)}
                        className={`w-full flex items-center justify-between p-2.5 transition-colors text-left ${
                          expandedPsychCharId === char.id ? "bg-white/15 hover:bg-white/20" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-200">Psychology</span>
                        <span className="font-mono text-[9px] font-bold text-slate-400">
                          {expandedPsychCharId === char.id ? "[ Hide ]" : "[ Expand ]"}
                        </span>
                      </button>
                      {expandedPsychCharId === char.id && (
                        <div className="p-3 border-t border-white/8 bg-black/50 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block font-mono uppercase text-[8px] tracking-wider mb-0.5">Outer Personality</span>
                            <p className="text-white font-semibold text-[10px] leading-snug">{char.psychology.social}</p>
                            <p className="text-slate-400 text-[9px] mt-0.5 leading-snug">{char.psychology.core}</p>
                          </div>
                          <div>
                            <span className="text-orange-400 block font-mono uppercase text-[8px] tracking-wider mb-0.5">What They're Hiding</span>
                            <p className="text-orange-300 font-semibold text-[10px] leading-snug">{char.psychology.hidden}</p>
                            <p className="text-slate-400 text-[9px] mt-0.5 leading-snug">{char.psychology.personal}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Style Lock — collapsible */}
                    <div className="bg-black/30 border border-white/8 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedVisualsCharId(expandedVisualsCharId === char.id ? null : char.id)}
                        className={`w-full flex items-center justify-between p-2.5 transition-colors text-left ${
                          expandedVisualsCharId === char.id
                            ? "bg-white/15 hover:bg-white/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold tracking-wider text-slate-200">
                          <Sparkles className="w-3 h-3 text-slate-400" />
                          Visual Style Guide
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-400">
                          {expandedVisualsCharId === char.id ? "[ Hide ]" : "[ Expand ]"}
                        </span>
                      </button>

                      {expandedVisualsCharId === char.id && (
                        <div className="p-3 border-t border-white/8 bg-black/50 space-y-3 text-[11px] leading-relaxed">
                          <div>
                            <span className="text-slate-500 block uppercase font-mono text-[9px] tracking-wider mb-1">Lighting & Texture Style</span>
                            <div className="text-slate-100 p-2.5 rounded bg-black/60 border border-white/8 italic">
                              "{char.visuals.material_texture}"
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-500 block uppercase font-mono text-[9px] tracking-wider mb-1">Wardrobe — Outer Mask</span>
                              <div className="text-slate-200 p-2 rounded bg-black/40 border border-white/8 text-[10px]">
                                {char.visuals.wardrobe.outer_mask}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase font-mono text-[9px] tracking-wider mb-1">Wardrobe — Inner Vulnerability</span>
                              <div className="text-slate-300 p-2 rounded bg-black/40 border border-white/8 text-[10px] italic">
                                {char.visuals.wardrobe.inner_vulnerability}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-slate-300 font-mono text-[9px] uppercase tracking-wider font-bold">Image Generation Prompt</span>
                              <button
                                onClick={() => {
                                  const txt = char.prompts?.master_visual_reference?.master_grid_prompt || "";
                                  navigator.clipboard.writeText(txt);
                                  setCopiedCharId(char.id);
                                  setTimeout(() => setCopiedCharId(null), 2000);
                                }}
                                className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 hover:bg-orange-600 hover:text-white border border-white/15 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {copiedCharId === char.id
                                  ? <><CheckCircle className="w-3 h-3 text-emerald-400" />Copied!</>
                                  : <><Copy className="w-3 h-3" />Copy</>
                                }
                              </button>
                            </div>
                            <div className="p-2.5 rounded bg-black border border-white/10 font-mono text-[10px] text-emerald-400/80 overflow-x-auto whitespace-pre-wrap leading-normal">
                              {char.prompts?.master_visual_reference?.master_grid_prompt}
                            </div>
                          </div>
                          {char.visuals.negative_prompt && (
                            <div>
                              <span className="text-slate-500 block uppercase font-mono text-[9px] tracking-wider mb-0.5">Negative Prompts</span>
                              <span className="text-red-400 font-mono text-[10px]">{char.visuals.negative_prompt}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </motion.div>
                </AnimatePresence>
              )}
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
