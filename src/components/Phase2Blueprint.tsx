import { useState, useEffect, useRef } from "react";
import { StoryOption, Blueprint, BeatSheet, SubtextualBeat, Sequence } from "../types";
import { PRESEEDED_BLUEPRINT } from "../preseededData";
import { GreenhouseVisualizer } from "./GreenhouseVisualizer";
import {
  Sparkles, ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  Volume2, Film, Palette, Music, CheckCircle
} from "lucide-react";
import { StoryboardPanel } from "./StoryboardPanel";
import { StylePresetPanel } from "./StylePresetPanel";
import { PRESEEDED_STYLE_PRESET } from "../preseededData";
import { motion, AnimatePresence } from "motion/react";
import {
  getBlueprintSequences, getBlueprintBeats, getBlueprintLogline,
  getStoryCharacters, getStoryMeaning
} from "../utils/schemaConverter";

interface Phase2BlueprintProps {
  chosenOption?: StoryOption;
  onSelectBlueprint: (blueprint: Blueprint) => void;
  selectedBlueprint?: Blueprint;
}

type RightView = "sequences" | "scenes" | "beats";

function makeShotId(seqId: string, seqGlobalIdx: number, sceneNum: number, beatNum: number) {
  const actNum = seqId.match(/^A(\d+)/)?.[1] ?? "1";
  return `A${actNum}_Q${seqGlobalIdx}_S${sceneNum}_B${beatNum}`;
}

const ACT_LABELS  = ["ACT I",   "ACT II",       "ACT III"];
const ACT_COLORS  = [
  { tab: "text-blue-400",  badge: "text-blue-400 bg-blue-950/40 border-blue-800/50" },
  { tab: "text-amber-400", badge: "text-amber-400 bg-amber-950/40 border-amber-800/50" },
  { tab: "text-red-400",   badge: "text-red-400 bg-red-950/40 border-red-800/50" },
];

export function Phase2Blueprint({ chosenOption, onSelectBlueprint, selectedBlueprint }: Phase2BlueprintProps) {
  const [blueprint, setBlueprint]         = useState<Blueprint>(selectedBlueprint || PRESEEDED_BLUEPRINT);
  const [isLoading, setIsLoading]         = useState(false);
  const [errorInfo, setErrorInfo]         = useState<string | null>(null);

  // Navigation state
  const [activeActIdx, setActiveActIdx]   = useState(0);
  const [rightView, setRightView]         = useState<RightView>("sequences");
  const [activeSeqId,  setActiveSeqId]    = useState<string | null>(null);
  const [activeSceneNum, setActiveSceneNum] = useState<number | null>(null);
  const [activeBeatIdx, setActiveBeatIdx] = useState(0);

  // Fold states
  const [scenesExpanded, setScenesExpanded] = useState(false);
  const [beatsExpanded,  setBeatsExpanded]  = useState(false);

  // Auto-select Act I / Seq 1 on first load
  const hasAutoSelected = useRef(false);

  const handleGenerateBlueprint = async () => {
    if (!chosenOption) return;
    setIsLoading(true); setErrorInfo(null);
    try {
      const resp = await fetch("/api/generate-phase2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chosenOption }),
      });
      const data = await resp.json();
      if (data.success && data.blueprint) {
        setBlueprint(data.blueprint); onSelectBlueprint(data.blueprint);
        resetNav();
      } else {
        setErrorInfo(data.message || "Could not generate. Rendering preseeded data.");
        setBlueprint(PRESEEDED_BLUEPRINT); onSelectBlueprint(PRESEEDED_BLUEPRINT);
      }
    } catch {
      setErrorInfo("Gemini endpoint unreachable. Rendered preseeded maps.");
      setBlueprint(PRESEEDED_BLUEPRINT); onSelectBlueprint(PRESEEDED_BLUEPRINT);
    } finally { setIsLoading(false); }
  };

  const resetNav = () => {
    setRightView("sequences"); setActiveSeqId(null);
    setActiveSceneNum(null); setActiveBeatIdx(0);
  };

  useEffect(() => {
    if (chosenOption && chosenOption.title !== blueprint.title) {
      setBlueprint({ ...PRESEEDED_BLUEPRINT, title: chosenOption.title,
        setting: chosenOption.setting, meaning: chosenOption.meaning, characters: chosenOption.characters });
    }
  }, [chosenOption]);

  // Auto-select Act I / Seq 1 the first time the component renders with sequences
  useEffect(() => {
    if (hasAutoSelected.current) return;
    const seqs = getBlueprintSequences(blueprint);
    const firstSeq = seqs.act_one_sequences?.[0];
    if (firstSeq) {
      const firstScene = firstSeq.scenes?.[0];
      setActiveActIdx(0);
      setActiveSeqId(firstSeq.sequence_id);
      setActiveSceneNum(firstScene?.scene_number ?? null);
      setActiveBeatIdx(0);
      setScenesExpanded(false);
      setBeatsExpanded(false);
      setRightView("scenes");
      hasAutoSelected.current = true;
    }
  }, [blueprint]);

  const convertedSequences = getBlueprintSequences(blueprint);
  const convertedBeats     = getBlueprintBeats(blueprint);
  const logline            = getBlueprintLogline(blueprint);
  const characters         = getStoryCharacters(blueprint as any);
  const meaning            = getStoryMeaning(blueprint as any);

  type SequenceWithMeta = Sequence & { actIdx: number; globalIdx: number };
  const actSeqArrays = [
    convertedSequences.act_one_sequences  || [],
    convertedSequences.act_two_sequences  || [],
    convertedSequences.act_three_sequences || [],
  ];
  const allSequences: SequenceWithMeta[] = actSeqArrays.flatMap((arr, ai) =>
    arr.map((s, i) => ({
      ...s, actIdx: ai,
      globalIdx: actSeqArrays.slice(0, ai).reduce((a, b) => a + b.length, 0) + i + 1
    }))
  );

  // Sequences visible for the active act tab
  const actSequences = allSequences.filter(s => s.actIdx === activeActIdx);

  // Active sequence object
  const activeSeq = allSequences.find(s => s.sequence_id === activeSeqId);

  // Active scene
  const activeScene = activeSeq?.scenes?.find(sc => sc.scene_number === activeSceneNum)
    ?? activeSeq?.scenes?.[0];

  // Beats
  const beatSheet: BeatSheet | undefined = convertedBeats.find(b => b.scene_number === (activeScene?.scene_number));
  const beats: SubtextualBeat[] = beatSheet?.micro_blueprint?.subtextual_beat_progression || [];
  const currentBeat = beats[activeBeatIdx] ?? beats[0];

  const currentShotId = activeSeq && currentBeat
    ? makeShotId(activeSeq.sequence_id, activeSeq.globalIdx, activeScene!.scene_number, currentBeat.beat_number)
    : "—";

  // Stress & vocal
  const stressMap: Record<number, number> = {1:20,2:40,3:60,4:75,5:88,6:98,7:92};
  const stress = currentBeat ? (stressMap[currentBeat.beat_number] ?? 85) : 15;

  const vocalProfile = (() => {
    if (!currentBeat) return null;
    const text = (currentBeat.action || "").toLowerCase();
    const speaker = characters.find(c =>
      text.includes(c.id.toLowerCase()) || text.includes((c.identity.name || "").toLowerCase().split(" ")[0])
    ) ?? characters[0];
    if (!speaker) return null;
    const key = (currentBeat.vocal_state || "neutral_state") as "neutral_state"|"tension_state"|"panic_state";
    const state = speaker.audio.state_telemetry[key] ?? speaker.audio.state_telemetry.neutral_state;
    return {
      name: speaker.identity.name,
      label: key.replace("_state","").toUpperCase(),
      stability: state.stability,
      style: (state as any).style_exaggeration ?? 15,
      stress_cues: state.stress_cues,
      framing: speaker.cinematics?.framing || "Macro Close-Up",
      palette: speaker.cinematics?.color_palette || [],
    };
  })();

  // ── Helpers ───────────────────────────────────────────────────────
  const selectAct = (idx: number) => {
    setActiveActIdx(idx);
    const actArrays = [
      getBlueprintSequences(blueprint).act_one_sequences   || [],
      getBlueprintSequences(blueprint).act_two_sequences   || [],
      getBlueprintSequences(blueprint).act_three_sequences || [],
    ];
    const firstSeq = actArrays[idx]?.[0];
    if (firstSeq) {
      const firstScene = firstSeq.scenes?.[0];
      setActiveSeqId(firstSeq.sequence_id);
      setActiveSceneNum(firstScene?.scene_number ?? null);
      setActiveBeatIdx(0);
      setScenesExpanded(false);
      setBeatsExpanded(false);
      setRightView("scenes");
    } else {
      resetNav();
    }
  };

  const selectSeq = (id: string) => {
    setActiveSeqId(id);
    const firstScene = allSequences.find(s => s.sequence_id === id)?.scenes?.[0];
    setActiveSceneNum(firstScene?.scene_number ?? null);
    setActiveBeatIdx(0);
    setScenesExpanded(false);
    setBeatsExpanded(false);
    setRightView("scenes");
  };

  const selectScene = (num: number) => {
    setActiveSceneNum(num);
    setActiveBeatIdx(0);
    setBeatsExpanded(false);
    setRightView("beats");
  };

  const goBack = () => {
    if (rightView === "beats")    { setRightView("scenes"); }
    else if (rightView === "scenes") { setRightView("sequences"); setActiveSeqId(null); }
  };

  // ── Breadcrumb label ──────────────────────────────────────────────
  const breadcrumb = [
    ACT_LABELS[activeActIdx],
    activeSeqId ?? null,
    rightView === "scenes" || rightView === "beats" ? (activeScene ? `Scene ${activeScene.scene_number}` : null) : null,
    rightView === "beats" && currentBeat ? `Beat ${currentBeat.beat_number}` : null,
  ].filter(Boolean).join(" › ");

  const colors = ACT_COLORS[activeActIdx];

  return (
    <div className="space-y-5">

      {/* ── Control bar (above card, mirrors Phase 1 section header) ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">Phase 2 — Narrative Deconstruction</span>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-lg">{logline}</p>
        </div>
        <button
          onClick={handleGenerateBlueprint} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs text-white font-mono font-bold transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? "Compiling..." : "Expand with Gemini AI"}
        </button>
      </div>

      {errorInfo && (
        <div className="p-2.5 rounded-lg border border-yellow-900/30 bg-yellow-950/25 text-yellow-500 text-[10px] font-mono">
          {errorInfo}
        </div>
      )}


      {/* ══ MAIN CARD — mirrors Phase 1 option card exactly ══════════════ */}
      <div className="rounded-2xl border border-orange-500/70 p-4 bg-gradient-to-br from-[#0c0c10] to-[#08080a] shadow-2xl">

        {/* Card header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/15 text-slate-300 shrink-0">
              Phase 02
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase shrink-0">
              <CheckCircle className="w-3 h-3" /> Blueprint Active
            </span>
            <h4 className="font-sans text-lg font-bold text-white tracking-tight truncate">
              {blueprint.title}
            </h4>
          </div>
          <button
            onClick={() => onSelectBlueprint(blueprint)}
            className="flex items-center gap-2 py-2 px-5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40"
          >
            Assemble Screenplay
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Two-column body — identical grid to Phase 1 ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* LEFT: Act tabs + act overview */}
          <div className="lg:col-span-4 flex flex-col gap-3">

            {/* Act tabs — mirrors Setting | Meaning tabs */}
            <div className="flex border border-white/15 rounded-lg overflow-hidden bg-black/50">
              {ACT_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => selectAct(i)}
                  className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    i > 0 ? "border-l border-white/10" : ""
                  } ${
                    activeActIdx === i ? "bg-white/15 text-white" : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Act overview content — mirrors Setting/Meaning panels */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeActIdx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors.badge}`}>
                    {ACT_LABELS[activeActIdx]}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
                    {["The Initiation","The Confrontation","The Resolution"][activeActIdx]}
                  </span>
                </div>

                {/* Sequences — embedded cards */}
                <div className="border-t border-white/8 pt-3 space-y-2">
                  <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wider mb-1.5">Sequences</span>
                  {actSequences.length === 0
                    ? <span className="text-[10px] text-slate-600 italic">Generate with Gemini AI.</span>
                    : actSequences.map(s => (
                        <button
                          key={s.sequence_id}
                          onClick={() => selectSeq(s.sequence_id)}
                          className={`w-full text-left rounded-lg p-2.5 border transition-all cursor-pointer group ${
                            activeSeqId === s.sequence_id
                              ? "border-current/20 bg-white/5 " + colors.badge
                              : "border-white/8 bg-black/30 hover:bg-white/5 hover:border-white/15 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`font-mono text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${
                              activeSeqId === s.sequence_id ? colors.badge : "border-white/15 text-slate-500"
                            }`}>
                              {s.sequence_id}
                            </span>
                            <span className="font-mono text-[8px] text-slate-500 truncate">{s.themeFocus}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors shrink-0 ml-auto" />
                          </div>
                          <p className="text-[10px] font-sans font-bold text-slate-200 leading-tight mb-0.5 group-hover:text-white transition-colors">{s.title}</p>
                          <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{s.dramatic_arc}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {s.scenes?.map(sc => (
                              <span key={sc.scene_number} className="font-mono text-[7px] px-1 py-0.5 rounded bg-black/50 border border-white/8 text-slate-600">
                                S{sc.scene_number}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))
                  }
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Drill-down panel — mirrors Characters & Voice Settings */}
          <div className="lg:col-span-8 flex flex-col gap-3">

            {/* Right panel header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {(rightView === "scenes" || rightView === "beats") && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase font-bold truncate">
                  {rightView === "sequences" && `Select a Sequence`}
                  {rightView === "scenes"    && `Scenes — ${activeSeqId}`}
                  {rightView === "beats"     && `Beats — Scene ${activeScene?.scene_number}`}
                </span>
              </div>
              <span className="font-mono text-[8px] text-slate-600 truncate hidden sm:block">{breadcrumb}</span>
            </div>

            <AnimatePresence mode="wait">
              {/* ── SEQUENCES PLACEHOLDER (sequences now live in left panel) ── */}
              {rightView === "sequences" && (
                <motion.div key="sequences"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="rounded-xl bg-white/3 border border-white/8 p-10 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <Film className="w-6 h-6 text-slate-700" />
                  <p className="text-slate-600 font-mono text-[10px] italic">
                    Select a sequence from the act panel to drill into scenes and beats.
                  </p>
                </motion.div>
              )}

              {/* ── SCENES VIEW ── */}
              {rightView === "scenes" && (
                <motion.div key="scenes"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {/* Scene tabs — foldable when > 1 scene */}
                  {activeSeq?.scenes && activeSeq.scenes.length > 0 && (
                    <div className="space-y-1.5">
                      {activeSeq.scenes.length > 1 && (
                        <button
                          onClick={() => setScenesExpanded(e => !e)}
                          className="flex items-center gap-1.5 w-full text-left px-0 py-0.5 text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${scenesExpanded ? "" : "-rotate-90"}`} />
                          {scenesExpanded ? "Collapse" : `Show all ${activeSeq.scenes.length} scenes`}
                        </button>
                      )}
                      <AnimatePresence>
                        {(activeSeq.scenes.length === 1 || scenesExpanded) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {activeSeq.scenes.map(sc => (
                                <button
                                  key={sc.scene_number}
                                  onClick={() => setActiveSceneNum(sc.scene_number)}
                                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all cursor-pointer border shrink-0 ${
                                    activeSceneNum === sc.scene_number
                                      ? "bg-white/15 border-white/25 text-white"
                                      : "bg-black/50 border-white/15 text-slate-300 hover:text-white hover:border-white/30"
                                  }`}
                                >
                                  Scene {sc.scene_number}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Scene detail card — mirrors character detail panel */}
                  {activeScene && (
                    <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-4">
                      {/* Scene header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/8">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">
                            Micro-Scene Objective
                          </span>
                          <h5 className="font-bold text-white text-sm">{activeScene.scene_objective || "Establish the dramatic frame."}</h5>
                        </div>
                        <button
                          onClick={() => selectScene(activeScene.scene_number)}
                          className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-slate-200 hover:text-white hover:bg-white/15 transition-all cursor-pointer shrink-0"
                        >
                          Open Beats <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Value shift */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-700 block mb-1">Opening (+)</span>
                          <p className="text-xs font-mono font-bold text-emerald-300 leading-tight">{activeScene.opening_value || "Hope"}</p>
                        </div>
                        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-red-700 block mb-1">Closing (—)</span>
                          <p className="text-xs font-mono font-bold text-red-300 leading-tight">{activeScene.closing_value || "Despair"}</p>
                        </div>
                      </div>

                      {/* Atmospheric layout */}
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Visual Layout</span>
                        <p className="text-[11px] text-slate-400 italic leading-relaxed">{activeScene.visualDesc || activeScene.narrative_action || "—"}</p>
                      </div>

                      {/* Character agendas */}
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Character Agendas</span>
                        <div className="grid grid-cols-2 gap-2">
                          {characters.slice(0, 2).map((char, idx) => (
                            <div key={char.id} className="bg-black/40 border border-white/8 rounded-lg p-2.5 flex items-start gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${idx === 0 ? "bg-orange-500" : "bg-emerald-500"}`} />
                              <div>
                                <span className="font-mono text-[9px] font-bold text-slate-300 block">{char.identity.name}</span>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{char.motivation?.conscious_desire || "—"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── BEATS VIEW ── */}
              {rightView === "beats" && (
                <motion.div key="beats"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3"
                >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Beat list — left column */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">Beat Progression</span>
                    {beats.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic font-mono py-4 text-center">Generate with Gemini AI.</p>
                    ) : (
                      <>
                        {(beatsExpanded ? beats : beats.slice(0, 2)).map((beat, bi) => {
                          const isActive = activeBeatIdx === bi;
                          const shotId   = activeSeq
                            ? makeShotId(activeSeq.sequence_id, activeSeq.globalIdx, activeScene!.scene_number, beat.beat_number)
                            : `B${beat.beat_number}`;
                          return (
                            <button
                              key={beat.beat_number}
                              onClick={() => setActiveBeatIdx(bi)}
                              className={`w-full text-left rounded-lg p-3 border transition-all cursor-pointer ${
                                isActive ? "border-orange-500/50 bg-orange-950/15" : "border-white/8 bg-black/30 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className={`font-mono text-[9px] font-bold ${isActive ? "text-orange-400" : "text-slate-500"}`}>
                                  BEAT {beat.beat_number}
                                </span>
                                <span className="font-mono text-[8px] text-slate-600 bg-black/60 border border-white/8 px-1.5 py-0.5 rounded">
                                  {shotId}
                                </span>
                              </div>
                              <p className="text-[11px] font-sans text-slate-200 leading-relaxed mb-1.5">"{beat.text}"</p>
                              <div className="space-y-0.5 border-t border-white/5 pt-1.5">
                                <div className="flex items-start gap-1.5 text-[9px] font-mono">
                                  <span className="text-orange-400 shrink-0 font-bold uppercase">{characters[0]?.identity?.name?.split(" ")[0] ?? "C1"}:</span>
                                  <span className="text-slate-400 uppercase tracking-wide leading-tight">{beat.action.split(":")[1]?.trim() || beat.action}</span>
                                </div>
                                <div className="flex items-start gap-1.5 text-[9px] font-mono">
                                  <span className="text-emerald-400 shrink-0 font-bold uppercase">{characters[1]?.identity?.name?.split(" ")[0] ?? "C2"}:</span>
                                  <span className="text-slate-400 uppercase tracking-wide leading-tight">{beat.reaction.split(":")[1]?.trim() || beat.reaction}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {beats.length > 2 && (
                          <button
                            onClick={() => setBeatsExpanded(e => !e)}
                            className="flex items-center gap-1.5 w-full justify-center py-1.5 text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer rounded-lg border border-white/6 bg-black/20 hover:bg-white/5"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${beatsExpanded ? "rotate-180" : ""}`} />
                            {beatsExpanded ? "Collapse beats" : `Show ${beats.length - 2} more beat${beats.length - 2 > 1 ? "s" : ""}`}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Payload — right column */}
                  <div className="space-y-3">
                    {/* Shot ID badge */}
                    {currentBeat && (
                      <div className="flex items-center justify-between bg-black/50 border border-white/10 rounded-lg px-3 py-2">
                        <span className="font-mono text-[9px] text-slate-500">Active Shot</span>
                        <span className="font-mono text-[10px] font-bold text-orange-400">{currentShotId}</span>
                      </div>
                    )}

                    {/* Audio */}
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3 h-3 text-emerald-400" />
                        <span className="font-mono text-[9px] text-slate-300 uppercase font-bold">Audio Payload</span>
                        <span className="ml-auto font-mono text-[8px] text-slate-600">{currentShotId}_AUDIO</span>
                      </div>
                      {vocalProfile ? (
                        <div className="space-y-1.5 text-[9px] font-mono">
                          <div className="flex justify-between text-slate-400"><span>Speaker</span><span className="text-slate-200 font-bold">{vocalProfile.name}</span></div>
                          <div className="flex justify-between text-slate-400">
                            <span>State</span>
                            <span className={`font-bold ${vocalProfile.label === "PANIC" ? "text-red-400" : vocalProfile.label === "TENSION" ? "text-amber-400" : "text-emerald-400"}`}>{vocalProfile.label}</span>
                          </div>
                          <div className="flex justify-between text-slate-400"><span>Stability</span><span className="text-white">{vocalProfile.stability}%</span></div>
                          <div className="flex justify-between text-slate-400"><span>Style</span><span className="text-white">{vocalProfile.style}%</span></div>
                          <p className="text-[8px] text-slate-600 italic border-t border-white/5 pt-1.5 leading-relaxed">{vocalProfile.stress_cues}</p>
                        </div>
                      ) : <p className="text-[9px] text-slate-600 italic">No vocal profile.</p>}
                    </div>

                    {/* Video */}
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Film className="w-3 h-3 text-blue-400" />
                        <span className="font-mono text-[9px] text-slate-300 uppercase font-bold">Video Prompt</span>
                        <span className="ml-auto font-mono text-[8px] text-slate-600">{currentShotId}_VIDEO</span>
                      </div>
                      <div className="space-y-1.5 text-[9px] font-mono">
                        <div className="flex justify-between text-slate-400"><span>Framing</span><span className="text-slate-200 text-right max-w-[120px] leading-tight">{vocalProfile?.framing || "Macro Close-Up"}</span></div>
                        <div className="flex justify-between text-slate-400">
                          <span>Motion</span>
                          <span className="text-slate-200">{currentBeat && currentBeat.beat_number <= 2 ? "190ms delay" : currentBeat && currentBeat.beat_number <= 4 ? "120ms delay" : "60ms rapid cut"}</span>
                        </div>
                        {currentBeat && <p className="text-[8px] text-slate-600 italic border-t border-white/5 pt-1.5 leading-relaxed">{currentBeat.visual_flora}</p>}
                      </div>
                    </div>

                    {/* Style + Greenhouse */}
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-purple-400" />
                        <span className="font-mono text-[9px] text-slate-300 uppercase font-bold">Styles Palette</span>
                        <span className="ml-auto font-mono text-[8px] text-slate-600">{currentShotId}_STYLE</span>
                      </div>
                      <div className="space-y-1.5 text-[9px] font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Environment</span>
                          <span className="text-slate-200">{stress > 70 ? "Defensive Crimson" : stress > 40 ? "Amber Warning" : "Ambient Teal"}</span>
                        </div>
                        {vocalProfile?.palette && (
                          <div className="flex gap-1.5 pt-1">
                            {vocalProfile.palette.map((hex, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className="w-3.5 h-3.5 rounded border border-white/10" style={{ backgroundColor: hex }} />
                                <span className="text-[8px] text-slate-600">{hex}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vocal Telemetry */}
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3 h-3 text-amber-400" />
                        <span className="font-mono text-[9px] text-slate-300 uppercase font-bold">Vocal Telemetry</span>
                        <span className={`ml-auto font-mono text-[8px] px-1.5 py-0.5 rounded border ${
                          stress > 70 ? "text-red-400 bg-red-950/30 border-red-900/50"
                          : stress > 40 ? "text-amber-400 bg-amber-950/30 border-amber-900/50"
                          : "text-emerald-400 bg-emerald-950/30 border-emerald-900/50"
                        }`}>{stress > 70 ? "PANIC" : stress > 40 ? "TENSION" : "NEUTRAL"}</span>
                      </div>
                      {[
                        { label: "Stability", value: vocalProfile?.stability ?? 75, color: "bg-emerald-500" },
                        { label: "Style",     value: vocalProfile?.style ?? 15,     color: "bg-amber-500" },
                      ].map(s => (
                        <div key={s.label}>
                          <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
                            <span>{s.label}</span><span className="text-slate-300">{s.value}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className={`${s.color} h-full rounded-full transition-all duration-500`} style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Greenhouse */}
                    <GreenhouseVisualizer
                      stressLevel={stress}
                      activeFlora={currentBeat?.visual_flora || "Luminescent orchids in stasis."}
                      activeStatus={currentBeat?.status || "Stable."}
                    />
                  </div>
                </div>{/* end inner grid */}

                {/* Storyboard Asset Map — full width below beat grid */}
                {currentBeat && (
                  <StoryboardPanel
                    shots={currentBeat.cinematic_storyboard || []}
                    beatText={currentBeat.text}
                    beatShotId={currentShotId}
                  />
                )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>{/* end right panel */}
        </div>{/* end two-col grid */}
      </div>{/* end card */}
    </div>
  );
}
