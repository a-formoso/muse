import { useState, useEffect, useRef } from "react";
import { Blueprint } from "../types";
import { getBlueprintSequences, getBlueprintBeats, getStoryCharacters } from "../utils/schemaConverter";
import { Sparkles, Film, ArrowRight, Play, AlertCircle, RefreshCw, ChevronRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { CharacterVariant } from "./Phase4Visuals";
import { supabase } from "../lib/supabase";

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await (supabase as any).auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { "Authorization": `Bearer ${token}` };
  } catch {}
  return {};
}

interface Phase5ShotsProps {
  blueprint: Blueprint;
  onProceed: () => void;
  characterVariants?: CharacterVariant[];
}

interface ShotJob {
  shotId: string;
  status: "idle" | "generating" | "image_done" | "video_done" | "error";
  imageUrl?: string;
  videoUrl?: string;
  prompt?: string;
  jobId?: string;
  selectedVariant?: string;
}

type FlatShot = {
  shotId: string; blueprintShotId?: string; seqId: string; seqTitle: string; sceneNum: number;
  beatNum: number; text: string; action: string; reaction: string;
  flora: string; vocal: string; framing: string; lighting: string;
  gestureVocab: string; setting: string; charName: string; charId: string; settingAbbrev: string;
};

function buildSeedancePrompt(shot: FlatShot, variantLabel?: string) {
  const stateNote = variantLabel ? `\n[CHARACTER STATE] ${variantLabel}` : "";
  const actionGerund = shot.action.split(":").slice(1).join(":").trim() || shot.action;
  const gestureDetail = shot.gestureVocab || "measured deliberate movement";
  const lighting = shot.lighting || "chiaroscuro key, heavy negative slope shadow, sharp rim highlight";
  return `[SHOT SETUP] ${shot.setting}, ${shot.framing}, ${lighting}
[OPENING FRAME] ${actionGerund} — focal target and body state
[MOTION] ${shot.charId}: ${actionGerund} — ${gestureDetail}
[CLOSING FRAME] ${shot.reaction}
[ATMOSPHERE] ${shot.flora} | Vocal state: ${shot.vocal}${stateNote}`.trim();
}

function abbreviateSetting(s: string): string {
  return s.split(",")[0].split("—")[0].trim().slice(0, 22);
}

export function Phase5Shots({ blueprint, onProceed, characterVariants = [] }: Phase5ShotsProps) {
  const sequences = getBlueprintSequences(blueprint);
  const beats = getBlueprintBeats(blueprint);
  const characters = getStoryCharacters(blueprint as any);

  const allSeqs = [
    ...(sequences.act_one_sequences || []),
    ...(sequences.act_two_sequences || []),
    ...(sequences.act_three_sequences || []),
  ];

  const flatShots: FlatShot[] = [];
  allSeqs.forEach((seq, si) => {
    seq.scenes?.forEach(scene => {
      const beatSheet = beats.find(b => b.scene_number === scene.scene_number);
      const beatList = beatSheet?.micro_blueprint?.subtextual_beat_progression || [];
      beatList.forEach(beat => {
        const actNum = seq.sequence_id.match(/^A(\d+)/)?.[1] ?? "1";
        const shotId = `A${actNum}_Q${si + 1}_S${scene.scene_number}_B${beat.beat_number}`;
        const speaker = characters.find(c =>
          beat.action?.toLowerCase().includes(c.identity?.name?.toLowerCase().split(" ")[0] ?? "")
        ) ?? characters[0];
        const settingRaw = scene.setting_micro || seq.setting_macro || "";
        flatShots.push({
          shotId,
          blueprintShotId: (beat as any).shot_id || undefined,
          seqId: seq.sequence_id,
          seqTitle: seq.title,
          sceneNum: scene.scene_number,
          beatNum: beat.beat_number,
          text: beat.text,
          action: beat.action,
          reaction: beat.reaction,
          flora: beat.visual_flora,
          vocal: beat.vocal_state || "neutral_state",
          framing: speaker?.cinematics?.framing || "MCU",
          lighting: speaker?.cinematics?.lighting || "chiaroscuro key, heavy negative slope shadow, sharp rim highlight",
          gestureVocab: speaker?.kinetics?.gesture_vocabulary || "",
          setting: settingRaw,
          settingAbbrev: abbreviateSetting(settingRaw),
          charName: speaker?.identity?.name || "Character",
          charId: speaker?.id || "",
        });
      });
    });
  });

  const [activeShotId, setActiveShotId] = useState<string>(flatShots[0]?.shotId || "");
  const [jobs, setJobs] = useState<Record<string, ShotJob>>({});
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const activeShot = flatShots.find(s => s.shotId === activeShotId) || flatShots[0];
  const activeJob = activeShotId ? jobs[activeShotId] : undefined;

  const getPrompt = (shot: FlatShot) => {
    if (editedPrompts[shot.shotId]) return editedPrompts[shot.shotId];
    const selectedVariant = jobs[shot.shotId]?.selectedVariant;
    const variantLabel = selectedVariant
      ? characterVariants.find(v => v.variantId === selectedVariant)?.label
      : undefined;
    return buildSeedancePrompt(shot, variantLabel);
  };

  const startPolling = (shotId: string, jobId: string) => {
    if (pollingRefs.current[shotId]) clearInterval(pollingRefs.current[shotId]);
    pollingRefs.current[shotId] = setInterval(async () => {
      try {
        const resp = await fetch(`/api/job-status/${jobId}`);
        const data = await resp.json();
        if (data.status === "completed") {
          clearInterval(pollingRefs.current[shotId]);
          delete pollingRefs.current[shotId];
          setJobs(prev => {
            const prev_ = prev[shotId];
            const wasVideo = prev_?.status === "generating" && prev_?.videoUrl !== undefined;
            return {
              ...prev,
              [shotId]: {
                ...prev_!,
                status: wasVideo ? "video_done" : "image_done",
                imageUrl: data.result?.url || prev_?.imageUrl,
                videoUrl: data.result?.video_url || prev_?.videoUrl,
              }
            };
          });
        } else if (data.status === "failed") {
          clearInterval(pollingRefs.current[shotId]);
          delete pollingRefs.current[shotId];
          setJobs(prev => ({ ...prev, [shotId]: { ...prev[shotId]!, status: "error" } }));
        }
      } catch {
        // keep polling until it succeeds or component unmounts
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  const generateImage = async (shot: FlatShot) => {
    const prompt = getPrompt(shot);
    const prev = jobs[shot.shotId];
    setJobs(j => ({ ...j, [shot.shotId]: { ...(prev || {}), shotId: shot.shotId, status: "generating", prompt } }));
    try {
      const authHeader = await getAuthHeader();
      const resp = await fetch("/api/generate-shot", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ shotId: shot.shotId, prompt, type: "image" }),
      });
      const data = await resp.json();
      if (data.success) {
        if (data.jobId) {
          setJobs(j => ({ ...j, [shot.shotId]: { shotId: shot.shotId, status: "generating", jobId: data.jobId, prompt } }));
          startPolling(shot.shotId, data.jobId);
        } else {
          setJobs(j => ({ ...j, [shot.shotId]: { shotId: shot.shotId, status: "image_done", imageUrl: data.imageUrl, prompt } }));
        }
      } else {
        setJobs(j => ({ ...j, [shot.shotId]: { shotId: shot.shotId, status: "error", prompt } }));
      }
    } catch {
      setJobs(j => ({ ...j, [shot.shotId]: { shotId: shot.shotId, status: "error", prompt } }));
    }
  };

  const promoteToVideo = async (shot: FlatShot) => {
    const job = jobs[shot.shotId];
    if (!job) return;
    setJobs(j => ({ ...j, [shot.shotId]: { ...job, status: "generating" } }));
    try {
      const authHeader = await getAuthHeader();
      const resp = await fetch("/api/generate-shot", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ shotId: shot.shotId, prompt: job.prompt, type: "video", imageUrl: job.imageUrl }),
      });
      const data = await resp.json();
      if (data.success) {
        if (data.jobId) {
          setJobs(j => ({ ...j, [shot.shotId]: { ...job, status: "generating", jobId: data.jobId, videoUrl: "" } }));
          startPolling(shot.shotId, data.jobId);
        } else {
          setJobs(j => ({ ...j, [shot.shotId]: { ...job, status: "video_done", videoUrl: data.videoUrl } }));
        }
      } else {
        setJobs(j => ({ ...j, [shot.shotId]: { ...job, status: "error" } }));
      }
    } catch {
      setJobs(j => ({ ...j, [shot.shotId]: { ...job, status: "error" } }));
    }
  };

  const setVariant = (shotId: string, variantId: string | undefined) => {
    setJobs(j => ({ ...j, [shotId]: { ...(j[shotId] || { shotId, status: "idle" }), selectedVariant: variantId } }));
    setEditedPrompts(p => {
      const newP = { ...p };
      delete newP[shotId];
      return newP;
    });
  };

  const doneCount = Object.values(jobs).filter(j => j.status === "video_done" || j.status === "image_done").length;
  const canProceed = doneCount > 0;

  const shotLabel = (shot: FlatShot) => {
    const framingAbbrev = shot.framing.replace("Close-Up", "CU").replace("Medium Close-Up", "MCU").replace("Medium Shot", "MS").replace("Wide Shot", "WS").replace("Extreme Close-Up", "ECU").replace("Over the Shoulder", "OTS");
    const charFirst = shot.charName.split(" ")[0];
    return `${framingAbbrev} ${charFirst}, ${shot.settingAbbrev}`;
  };

  if (flatShots.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">Phase 5 — Shot Generation</span>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Generate storyboard images and video clips per shot</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-10 flex flex-col items-center gap-3 text-center">
          <Film className="w-8 h-8 text-slate-700" />
          <p className="text-slate-500 font-mono text-[11px] italic">No beat data found. Complete Phase 2 blueprint generation first.</p>
        </div>
      </div>
    );
  }

  const activeCharVariants = activeShot
    ? characterVariants.filter(v => v.charId === activeShot.charId)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">Phase 5 — Shot Generation</span>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{flatShots.length} shots from scene manifest · {doneCount} generated</p>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-500/70 bg-gradient-to-br from-[#0c0c10] to-[#08080a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/15 text-slate-300">Phase 05</span>
            <span className="font-mono text-[10px] text-slate-400">{doneCount}/{flatShots.length} shots ready</span>
          </div>
          <button
            onClick={onProceed}
            disabled={!canProceed}
            title={!canProceed ? "Generate at least one shot to proceed" : undefined}
            className={`flex items-center gap-2 py-2 px-5 rounded-lg font-mono text-xs font-bold transition-all shadow-md ${
              canProceed
                ? "bg-orange-600 hover:bg-orange-500 text-white cursor-pointer shadow-orange-950/40"
                : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/10"
            }`}
          >
            Proceed to Assembly
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/8">
          {/* Shot list */}
          <div className="lg:col-span-4 overflow-y-auto max-h-[540px] p-3 space-y-1">
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2 px-1">Shot List</span>
            {flatShots.map(shot => {
              const job = jobs[shot.shotId];
              const isActive = activeShotId === shot.shotId;
              return (
                <button
                  key={shot.shotId}
                  onClick={() => setActiveShotId(shot.shotId)}
                  className={`w-full text-left rounded-lg p-2.5 border transition-all cursor-pointer ${
                    isActive ? "border-orange-500/50 bg-orange-950/15" : "border-white/8 bg-black/30 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-mono text-[8px] font-bold ${isActive ? "text-orange-400" : "text-slate-600"}`}>{shot.shotId}</span>
                    <ShotStatusBadge status={job?.status} />
                  </div>
                  <p className={`font-mono text-[10px] font-semibold leading-snug ${isActive ? "text-white" : "text-slate-300"}`}>
                    {shotLabel(shot)}
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5 leading-snug line-clamp-1 italic">
                    "{shot.text}"
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="font-mono text-[8px] text-slate-600 bg-black/50 border border-white/8 px-1 py-0.5 rounded">{shot.framing}</span>
                    <ChevronRight className={`w-3 h-3 ml-auto ${isActive ? "text-orange-400" : "text-slate-700"}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-8 p-4 space-y-4">
            {activeShot && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeShot.shotId}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* Shot header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/8">
                    <div>
                      <span className="text-[9px] font-mono text-orange-400 font-bold block mb-0.5">{activeShot.shotId}</span>
                      <h4 className="font-bold text-white text-sm">{shotLabel(activeShot)}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{activeShot.seqTitle} · {activeShot.setting}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeJob?.status === "image_done" && (
                        <button
                          onClick={() => promoteToVideo(activeShot)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/20 hover:bg-blue-950/40 text-[10px] text-blue-300 font-mono font-bold transition-all cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          Promote to Video
                        </button>
                      )}
                      {activeJob?.status === "error" ? (
                        <button
                          onClick={() => generateImage(activeShot)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-[10px] text-white font-mono font-bold transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      ) : (
                        <button
                          onClick={() => generateImage(activeShot)}
                          disabled={activeJob?.status === "generating"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-[10px] text-white font-mono font-bold transition-all cursor-pointer"
                        >
                          {activeJob?.status === "generating" ? (
                            <><RefreshCw className="w-3 h-3 animate-spin" />Generating…</>
                          ) : (
                            <><Sparkles className="w-3 h-3" />Generate Image</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Character version selector */}
                  {(() => {
                    // Combine user-added variants with auto-detected arc state variants from the active character
                    const activeChar = characters.find(c => c.id === activeShot.charId) ?? characters[0];
                    const ref = activeChar?.prompts?.master_visual_reference as Record<string, string | undefined> | undefined;
                    const arcStateVariants: { variantId: string; label: string }[] = [];
                    if (ref) {
                      let i = 2;
                      while (ref[`master_grid_prompt_state${i}`]) {
                        arcStateVariants.push({
                          variantId: `${activeChar?.id}_arc_state${i}`,
                          label: `Post-Arc (State ${i})`,
                        });
                        i++;
                      }
                    }
                    const allVariants = [
                      ...arcStateVariants,
                      ...activeCharVariants.filter(v => !arcStateVariants.some(a => a.variantId === v.variantId)),
                    ];
                    if (allVariants.length === 0) return null;
                    return (
                      <div className="space-y-1.5">
                        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Character State</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setVariant(activeShot.shotId, undefined)}
                            className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold border transition-all cursor-pointer ${
                              !activeJob?.selectedVariant
                                ? "bg-white/15 border-white/25 text-white"
                                : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            Baseline
                          </button>
                          {allVariants.map(v => (
                            <button
                              key={v.variantId}
                              onClick={() => setVariant(activeShot.shotId, v.variantId)}
                              className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold border transition-all cursor-pointer ${
                                activeJob?.selectedVariant === v.variantId
                                  ? "bg-violet-900/40 border-violet-500/40 text-violet-200"
                                  : "bg-black/50 border-white/10 text-slate-400 hover:text-violet-200 hover:border-violet-700/40"
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Prompt editor */}
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block mb-1.5">Seedance 2.0 Prompt</span>
                    <textarea
                      value={getPrompt(activeShot)}
                      onChange={e => setEditedPrompts(prev => ({ ...prev, [activeShot.shotId]: e.target.value }))}
                      className="w-full h-28 p-3 bg-black/70 border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Render canvas */}
                  <div className={`aspect-video rounded-xl border flex items-center justify-center transition-all ${
                    activeJob?.status === "video_done" ? "border-blue-500/40 bg-blue-950/10"
                    : activeJob?.status === "image_done" ? "border-emerald-500/40 bg-emerald-950/10"
                    : activeJob?.status === "generating" ? "border-orange-500/30 bg-orange-950/10"
                    : activeJob?.status === "error" ? "border-red-800/30 bg-red-950/10"
                    : "border-white/8 bg-black/30"
                  }`}>
                    {activeJob?.status === "video_done" && (
                      <div className="flex flex-col items-center gap-2">
                        <Play className="w-8 h-8 text-blue-400" />
                        <span className="text-[10px] font-mono text-blue-300">Video clip ready</span>
                      </div>
                    )}
                    {activeJob?.status === "image_done" && (
                      <div className="flex flex-col items-center gap-2">
                        <Film className="w-8 h-8 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-300">Storyboard image ready</span>
                      </div>
                    )}
                    {activeJob?.status === "generating" && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        <span className="text-[10px] font-mono text-orange-400">Polling Higgsfield — checking every 3s…</span>
                      </div>
                    )}
                    {activeJob?.status === "error" && (
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-500/70" />
                        <span className="text-[10px] font-mono text-red-400">Render failed — press Retry to resubmit</span>
                      </div>
                    )}
                    {(!activeJob || activeJob.status === "idle") && (
                      <div className="flex flex-col items-center gap-2">
                        <Film className="w-8 h-8 text-slate-700" />
                        <span className="text-[10px] font-mono text-slate-600">Press Generate Image to render this shot</span>
                      </div>
                    )}
                  </div>

                  {/* Shot ID cross-reference */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-950/30 border border-orange-500/25">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Shot ID</span>
                      <span className="font-mono text-[10px] font-bold text-orange-400">{activeShot.shotId}</span>
                    </div>
                    {activeShot.blueprintShotId && activeShot.blueprintShotId !== activeShot.shotId && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-950/30 border border-violet-500/25">
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Blueprint</span>
                        <span className="font-mono text-[10px] font-bold text-violet-400">{activeShot.blueprintShotId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/8">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Vocal</span>
                      <span className={`font-mono text-[9px] font-bold ${
                        activeShot.vocal === "panic_state" ? "text-red-400"
                        : activeShot.vocal === "tension_state" ? "text-amber-400"
                        : "text-slate-300"
                      }`}>{activeShot.vocal.replace("_state", "").toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/8">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">Flora</span>
                      <span className="font-mono text-[9px] text-emerald-400 line-clamp-1 max-w-[160px]">{activeShot.flora}</span>
                    </div>
                  </div>

                  {/* Beat context */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-1.5">
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Subtext Action</span>
                      <p className="text-[10px] text-slate-300 leading-snug uppercase tracking-wide">{activeShot.action.split(":")[1]?.trim() || activeShot.action}</p>
                    </div>
                    <div className="bg-black/40 border border-white/8 rounded-lg p-3 space-y-1.5">
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Dialogue Context</span>
                      <p className="text-[10px] text-slate-400 leading-snug italic line-clamp-3">"{activeShot.text}"</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotStatusBadge({ status }: { status?: string }) {
  if (!status || status === "idle") return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
    </div>
  );
  if (status === "generating") return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
    </div>
  );
  if (status === "image_done") return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    </div>
  );
  if (status === "video_done") return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
    </div>
  );
  if (status === "error") return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
    </div>
  );
  return null;
}
