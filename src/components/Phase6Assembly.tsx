import { useState, useRef, useCallback } from "react";
import { Blueprint, Character } from "../types";
import { getBlueprintSequences, getBlueprintBeats, getStoryCharacters } from "../utils/schemaConverter";
import {
  Download, Music, Film, BarChart2, GripHorizontal, ArrowLeft,
  CheckCircle, AlertCircle, Play, Square, Loader2, RefreshCw,
  Lock, ChevronRight, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

interface Phase6AssemblyProps {
  blueprint: Blueprint;
  onBack: () => void;
}

interface TimelineClip {
  shotId: string;
  seqTitle: string;
  beatText: string;
  charName: string;
  charId: string;
  flora: string;
  vocal: string;
  approved: boolean;
}

type VocalState = "neutral_state" | "tension_state" | "panic_state";

interface ViralityScores {
  emotional_impact: number;
  visual_novelty: number;
  pacing_score: number;
  overall: number;
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
}

interface AudioState {
  loading: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}

function vocalStateColor(s: string) {
  if (s === "panic_state") return "text-red-400 border-red-900/50 bg-red-950/20";
  if (s === "tension_state") return "text-amber-400 border-amber-900/50 bg-amber-950/20";
  return "text-emerald-400 border-emerald-900/50 bg-emerald-950/20";
}

function vocalStateLabel(s: string) {
  return s.replace("_state", "").toUpperCase();
}

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-400";
  if (n >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBarColor(n: number) {
  if (n >= 80) return "bg-emerald-500";
  if (n >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function Phase6Assembly({ blueprint, onBack }: Phase6AssemblyProps) {
  const { accessTier } = useAuth();
  const isStudio = accessTier.tier === "studio";

  const sequences = getBlueprintSequences(blueprint);
  const beats = getBlueprintBeats(blueprint);
  const characters = getStoryCharacters(blueprint as any) as Character[];

  const allSeqs = [
    ...(sequences.act_one_sequences || []),
    ...(sequences.act_two_sequences || []),
    ...(sequences.act_three_sequences || []),
  ];

  // Build clips from blueprint
  const initialClips: TimelineClip[] = [];
  allSeqs.forEach((seq, si) => {
    seq.scenes?.forEach(scene => {
      const beatSheet = beats.find(b => b.scene_number === scene.scene_number);
      const beatList = beatSheet?.micro_blueprint?.subtextual_beat_progression || [];
      beatList.slice(0, 2).forEach((beat, bi) => {
        const actNum = seq.sequence_id.match(/^A(\d+)/)?.[1] ?? "1";
        const shotId = `A${actNum}_Q${si + 1}_S${scene.scene_number}_B${beat.beat_number}`;
        const speaker = characters.find(c =>
          beat.action?.toLowerCase().includes((c.identity?.name ?? "").toLowerCase().split(" ")[0])
        ) ?? characters[0];
        initialClips.push({
          shotId,
          seqTitle: seq.title,
          beatText: beat.text || "",
          charName: speaker?.identity?.name || "—",
          charId: speaker?.id || "char_1",
          flora: beat.visual_flora || "",
          vocal: beat.vocal_state || "neutral_state",
          approved: bi === 0,
        });
      });
    });
  });

  // ── State ──
  const [clipOrder, setClipOrder] = useState<TimelineClip[]>(initialClips);
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(initialClips[0] ?? null);
  const [activeAudioChar, setActiveAudioChar] = useState(0);
  const [activeVocalState, setActiveVocalState] = useState<VocalState>("neutral_state");
  const [audioState, setAudioState] = useState<AudioState>({ loading: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [viralityScores, setViralityScores] = useState<ViralityScores | null>(null);
  const [viralityLoading, setViralityLoading] = useState(false);
  const [viralityError, setViralityError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Timeline drag ──
  const handleDragStart = (i: number) => { dragIndexRef.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIndex(i);
  };
  const handleDrop = (toIndex: number) => {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === toIndex) { setDragOverIndex(null); return; }
    const next = [...clipOrder];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    setClipOrder(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };
  const moveClip = (from: number, to: number) => {
    const next = [...clipOrder];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setClipOrder(next);
  };

  // ── Audio synthesis ──
  const handleSynthesize = useCallback(async () => {
    const char = characters[activeAudioChar];
    if (!char) return;

    const voiceId = char.audio?.voice_identity?.voice_clone_id;
    const telemetry = char.audio?.state_telemetry?.[activeVocalState];
    const monologue = char.audio?.monologue_script || `My name is ${char.identity?.name}. This is my world.`;

    if (!voiceId) {
      setAudioState({ loading: false, error: "No voice_clone_id on this character. Add one in the blueprint." });
      return;
    }

    setAudioState({ loading: true });
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    try {
      const res = await fetch("/api/elevenlabs/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: monologue,
          stability: telemetry?.stability ?? 75,
          similarityBoost: telemetry?.similarity_boost ?? 75,
          styleExaggeration: telemetry?.style_exaggeration ?? 15,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setAudioState({ loading: false, error: data.message });
        return;
      }
      setAudioState({ loading: false, audioBase64: data.audioBase64, mimeType: data.mimeType });
    } catch (e: any) {
      setAudioState({ loading: false, error: e.message });
    }
  }, [characters, activeAudioChar, activeVocalState]);

  const handlePlayPause = useCallback(() => {
    if (!audioState.audioBase64) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    const dataUrl = `data:${audioState.mimeType ?? "audio/mpeg"};base64,${audioState.audioBase64}`;
    const audio = new Audio(dataUrl);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  }, [audioState, isPlaying]);

  // ── Virality scoring ──
  const handleViralityScore = useCallback(async () => {
    setViralityLoading(true);
    setViralityError(null);
    try {
      const res = await fetch("/api/virality-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint, clipOrder }),
      });
      const data = await res.json();
      if (!data.success) { setViralityError(data.message); return; }
      setViralityScores(data.scores);
    } catch (e: any) {
      setViralityError(e.message);
    } finally {
      setViralityLoading(false);
    }
  }, [blueprint, clipOrder]);

  // ── Export ──
  const handleExport = async () => {
    if (!isStudio) return;
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 2200));
    setIsExporting(false);
    setExportDone(true);
    // Build a simple text manifest and download it
    const manifest = [
      `INFINITE STUDIO — FINAL CUT MANIFEST`,
      `Title: ${blueprint.title}`,
      `Clips: ${clipOrder.length}`,
      ``,
      ...clipOrder.map((c, i) => `[${i + 1}] ${c.shotId} — "${c.beatText}" (${vocalStateLabel(c.vocal)})`),
      ``,
      viralityScores ? `Virality Score: ${viralityScores.overall}/100 — ${viralityScores.recommendation}` : "",
    ].join("\n");
    const blob = new Blob([manifest], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blueprint.title?.replace(/\s+/g, "_") || "final_cut"}_manifest.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeChar = characters[activeAudioChar];
  const activeTelemetry = activeChar?.audio?.state_telemetry?.[activeVocalState];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">Phase 6 — Assembly & Export</span>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Timeline · ElevenLabs Audio · Virality · Final Render</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-mono transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Shots
        </button>
      </div>

      <div className="rounded-2xl border border-orange-500/70 bg-gradient-to-br from-[#0c0c10] to-[#08080a] shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/15 text-slate-300">Phase 06</span>
            <span className="font-mono text-[10px] text-slate-400">{clipOrder.length} clips in timeline</span>
          </div>
          {isStudio ? (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex items-center gap-2 py-2 px-5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                exportDone
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
                  : "bg-orange-600 hover:bg-orange-500 shadow-orange-950/40"
              } text-white`}
            >
              {isExporting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rendering…</>
              ) : exportDone ? (
                <><CheckCircle className="w-3.5 h-3.5" />Downloaded</>
              ) : (
                <><Download className="w-3.5 h-3.5" />Export Final Cut</>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/3 text-[10px] font-mono text-slate-500">
              <Lock className="w-3 h-3 text-yellow-600" />
              Export — Studio tier only
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">

          {/* ── Timeline ── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Film className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest font-bold">Timeline</span>
              <span className="font-mono text-[9px] text-slate-600 ml-auto">Drag to reorder</span>
            </div>
            <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
              {clipOrder.map((clip, i) => (
                <motion.div
                  key={clip.shotId + i}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={`shrink-0 w-32 rounded-lg border cursor-pointer transition-all select-none ${
                    dragOverIndex === i
                      ? "border-orange-500/70 bg-orange-950/30 scale-105"
                      : selectedClip?.shotId === clip.shotId
                      ? "border-orange-500/60 bg-orange-950/20"
                      : "border-white/8 bg-black/40 hover:border-white/20"
                  }`}
                  onClick={() => setSelectedClip(clip)}
                >
                  <div className="p-2 space-y-1.5">
                    <div className="aspect-video bg-white/5 rounded border border-white/5 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                      {clip.approved ? (
                        <div className="w-5 h-5 rounded-full border border-emerald-500/50 bg-emerald-950/60 flex items-center justify-center z-10">
                          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-emerald-400 border-b-[4px] border-b-transparent ml-0.5" />
                        </div>
                      ) : (
                        <Film className="w-3.5 h-3.5 text-slate-700 z-10" />
                      )}
                      <div className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                        clip.vocal === "panic_state" ? "bg-red-500" :
                        clip.vocal === "tension_state" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                    </div>
                    <p className="text-[7px] font-mono text-orange-400/80 font-bold leading-none truncate">{clip.shotId}</p>
                    <p className="text-[7px] text-slate-500 leading-snug line-clamp-2">"{clip.beatText}"</p>
                    <div className="flex items-center justify-between gap-1">
                      <GripHorizontal className="w-3 h-3 text-slate-700 cursor-grab" />
                      <div className="flex gap-0.5">
                        {i > 0 && (
                          <button onClick={e => { e.stopPropagation(); moveClip(i, i - 1); }}
                            className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-[8px] text-slate-400 cursor-pointer">←</button>
                        )}
                        {i < clipOrder.length - 1 && (
                          <button onClick={e => { e.stopPropagation(); moveClip(i, i + 1); }}
                            className="w-4 h-4 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-[8px] text-slate-400 cursor-pointer">→</button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* ── Selected clip detail ── */}
            <div className="lg:col-span-4 space-y-3">
              <AnimatePresence mode="wait">
                {selectedClip ? (
                  <motion.div
                    key={selectedClip.shotId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-orange-400 font-bold block mb-0.5">{selectedClip.shotId}</span>
                      <h4 className="font-bold text-white text-sm leading-snug">{selectedClip.seqTitle}</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 italic leading-relaxed border-l-2 border-orange-500/40 pl-2.5">
                      "{selectedClip.beatText}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                      <div className="bg-black/50 border border-white/8 rounded-lg p-2">
                        <span className="text-slate-500 block mb-0.5">Character</span>
                        <span className="text-slate-200 font-bold">{selectedClip.charName}</span>
                      </div>
                      <div className={`border rounded-lg p-2 ${vocalStateColor(selectedClip.vocal)}`}>
                        <span className="block mb-0.5 opacity-70">Vocal State</span>
                        <span className="font-bold">{vocalStateLabel(selectedClip.vocal)}</span>
                      </div>
                    </div>
                    <div className="bg-black/50 border border-white/8 rounded-lg p-2.5 text-[9px]">
                      <span className="font-mono text-slate-500 block mb-1">Flora / Environment</span>
                      <p className="text-slate-300 italic leading-snug">{selectedClip.flora || "—"}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-black/40 border border-white/8 rounded-xl p-8 flex items-center justify-center">
                    <p className="text-[10px] font-mono text-slate-600 italic">Select a clip from the timeline</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right column ── */}
            <div className="lg:col-span-8 space-y-3">

              {/* ElevenLabs Audio Panel */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[9px] text-slate-300 uppercase font-bold tracking-wider">ElevenLabs Audio</span>
                  <span className="ml-auto text-[8px] font-mono text-slate-600">eleven_multilingual_v2</span>
                </div>

                {characters.length > 0 ? (
                  <div className="space-y-3">
                    {/* Character tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {characters.map((c, i) => (
                        <button
                          key={c.id || i}
                          onClick={() => { setActiveAudioChar(i); setAudioState({ loading: false }); setIsPlaying(false); }}
                          className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold border transition-all cursor-pointer ${
                            activeAudioChar === i
                              ? "bg-white/15 border-white/25 text-white"
                              : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          {c.identity?.name?.split(" ")[0] ?? `Char ${i + 1}`}
                        </button>
                      ))}
                    </div>

                    {activeChar && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Voice identity */}
                        <div className="space-y-1.5 text-[9px] font-mono">
                          {[
                            { label: "Voice Clone ID", value: activeChar.audio?.voice_identity?.voice_clone_id || "—" },
                            { label: "Sonic Anchor", value: activeChar.audio?.voice_identity?.sonic_anchor || "—" },
                            { label: "Timbre", value: activeChar.audio?.performance_styling?.timbre || "—" },
                            { label: "Tempo", value: activeChar.audio?.performance_styling?.tempo || "—" },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between gap-2 bg-black/30 rounded px-2 py-1 border border-white/5">
                              <span className="text-slate-500 shrink-0">{label}</span>
                              <span className="text-slate-300 text-right truncate max-w-[140px]" title={value}>{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Telemetry + generate */}
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 mb-1">Vocal State Telemetry</div>
                          <div className="flex gap-1.5">
                            {(["neutral_state", "tension_state", "panic_state"] as VocalState[]).map(state => (
                              <button
                                key={state}
                                onClick={() => { setActiveVocalState(state); setAudioState({ loading: false }); setIsPlaying(false); }}
                                className={`flex-1 py-1 rounded border text-[8px] font-bold font-mono transition-all cursor-pointer ${
                                  activeVocalState === state
                                    ? vocalStateColor(state) + " ring-1 ring-current/30"
                                    : "border-white/8 bg-black/30 text-slate-600 hover:text-slate-400"
                                }`}
                              >
                                {vocalStateLabel(state).slice(0, 4)}
                              </button>
                            ))}
                          </div>

                          {activeTelemetry && (
                            <div className="space-y-1 text-[8px] font-mono">
                              {[
                                { label: "Stability", value: activeTelemetry.stability },
                                { label: "Similarity", value: activeTelemetry.similarity_boost },
                                { label: "Style", value: activeTelemetry.style_exaggeration },
                              ].map(({ label, value }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-slate-600 w-16 shrink-0">{label}</span>
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${value}%` }} />
                                  </div>
                                  <span className="text-slate-400 w-6 text-right">{value}</span>
                                </div>
                              ))}
                              <p className="text-slate-600 italic leading-snug pt-0.5">{activeTelemetry.stress_cues}</p>
                            </div>
                          )}

                          {/* Generate + play controls */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleSynthesize}
                              disabled={audioState.loading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-mono text-[9px] font-bold transition-all cursor-pointer"
                            >
                              {audioState.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              Synthesize
                            </button>
                            {audioState.audioBase64 && (
                              <button
                                onClick={handlePlayPause}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-[9px] font-bold transition-all cursor-pointer border border-white/10"
                              >
                                {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                {isPlaying ? "Stop" : "Play"}
                              </button>
                            )}
                          </div>

                          {audioState.error && (
                            <p className="text-[8px] font-mono text-red-400 italic leading-snug">{audioState.error}</p>
                          )}
                          {audioState.audioBase64 && !audioState.error && (
                            <p className="text-[8px] font-mono text-emerald-500 italic">Audio ready — {activeChar.identity?.name} / {vocalStateLabel(activeVocalState)}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] font-mono text-slate-600 italic">No character audio data found in blueprint.</p>
                )}
              </div>

              {/* Virality Predictor */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono text-[9px] text-slate-300 uppercase font-bold tracking-wider">Virality Predictor</span>
                  <button
                    onClick={handleViralityScore}
                    disabled={viralityLoading}
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/30 text-purple-300 font-mono text-[8px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {viralityLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {viralityScores ? "Re-score" : "Score Assembly"}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {viralityLoading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-[9px] font-mono text-slate-500 py-2">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      Analysing narrative tension, pacing, and flora arc…
                    </motion.div>
                  )}

                  {viralityError && !viralityLoading && (
                    <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-[9px] font-mono text-red-400 italic">{viralityError}</motion.p>
                  )}

                  {viralityScores && !viralityLoading && (
                    <motion.div key="scores" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {/* Overall */}
                      <div className="flex items-end gap-4">
                        <div className={`text-5xl font-bold ${scoreColor(viralityScores.overall)}`}>
                          {viralityScores.overall}
                        </div>
                        <div className="flex-1 space-y-1.5 pb-1">
                          {[
                            { label: "Emotional Impact", value: viralityScores.emotional_impact },
                            { label: "Visual Novelty", value: viralityScores.visual_novelty },
                            { label: "Pacing Score", value: viralityScores.pacing_score },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-0.5">
                                <span>{label}</span><span className={scoreColor(value)}>{value}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${value}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${scoreBarColor(value)}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendation */}
                      <p className="text-[9px] font-mono text-slate-400 italic border-l-2 border-purple-500/40 pl-2.5 leading-relaxed">
                        {viralityScores.recommendation}
                      </p>

                      {/* Strengths / weaknesses */}
                      <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
                        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2 space-y-1">
                          <span className="text-emerald-500 font-bold block">Strengths</span>
                          {viralityScores.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-1 text-slate-400">
                              <ChevronRight className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />{s}
                            </div>
                          ))}
                        </div>
                        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2 space-y-1">
                          <span className="text-red-400 font-bold block">Weaknesses</span>
                          {viralityScores.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-1 text-slate-400">
                              <ChevronRight className="w-2.5 h-2.5 text-red-700 shrink-0 mt-0.5" />{w}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!viralityScores && !viralityLoading && !viralityError && (
                    <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-[9px] font-mono text-slate-600 italic">
                      Click "Score Assembly" to run AI virality analysis on your current clip order.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Status footer */}
              {!isStudio && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-yellow-900/30 bg-yellow-950/10 text-[9px] font-mono text-slate-500">
                  <Lock className="w-3 h-3 text-yellow-600 shrink-0" />
                  <span>Export Final Cut and commercial rights require the <span className="text-yellow-500">Studio</span> plan.</span>
                </div>
              )}
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-white/8 bg-black/30 text-[9px] font-mono text-slate-600">
                <AlertCircle className="w-3 h-3 text-slate-700 shrink-0" />
                HIGGSFIELD_API_KEY · HIGGSFIELD_SECRET · ELEVENLABS_API_KEY required for full render pipeline.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
