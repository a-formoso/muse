import { useState } from "react";
import { CinematicShot } from "../types";
import { Film, Camera, Aperture, Zap, X, Copy, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StoryboardPanelProps {
  shots: CinematicShot[];
  beatText: string;
  beatShotId: string;
}

export function StoryboardPanel({ shots, beatText, beatShotId }: StoryboardPanelProps) {
  const [activeShot, setActiveShot] = useState<CinematicShot | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-white/3">
          <Film className="w-3 h-3 text-blue-400 shrink-0" />
          <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            Shot List Generation Manifest
          </span>
          <span className="ml-auto font-mono text-[8px] text-slate-600">{beatShotId}</span>
        </div>

        <div className="p-3">
          <p className="font-mono text-[9px] text-slate-500 italic mb-2.5 leading-relaxed truncate">
            "{beatText}"
          </p>

          {shots.length === 0 ? (
            <p className="text-[9px] text-slate-600 italic font-mono py-2 text-center">
              No storyboard frames for this beat.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shots.map((shot) => (
                <button
                  key={shot.shot_id}
                  onClick={() => setActiveShot(shot)}
                  className="shrink-0 w-44 text-left rounded-lg border border-white/10 bg-black/50 hover:border-blue-500/40 hover:bg-blue-950/10 transition-all cursor-pointer group p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[8px] font-bold text-blue-400 truncate">
                      [{shot.shot_id}]
                    </span>
                    <Film className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                  <p className="font-mono text-[9px] font-bold text-slate-200 leading-tight line-clamp-1">
                    {shot.composition.framing}
                  </p>
                  <p className="font-mono text-[8px] text-slate-500 leading-tight line-clamp-2">
                    {shot.composition.focal_target}
                  </p>
                  <div className="border-t border-white/5 pt-1.5">
                    <p className="font-mono text-[7px] text-slate-600 line-clamp-2 italic leading-relaxed">
                      {shot.automated_image_prompt.slice(0, 60)}…
                    </p>
                  </div>
                  <div className="text-[7px] font-mono text-blue-500/70 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
                    View Prompt →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeShot && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
              onClick={() => setActiveShot(null)}
            />

            <motion.div
              key="drawer"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full z-50 flex flex-col bg-[#08080c] border-l border-white/10 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/8 bg-white/3 sticky top-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-mono text-[10px] font-bold text-slate-200 truncate">
                    {activeShot.shot_id}
                  </span>
                </div>
                <button
                  onClick={() => setActiveShot(null)}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/3 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Camera className="w-3 h-3 text-blue-400" />
                    <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">Composition</span>
                  </div>
                  {[
                    { label: "Framing",        value: activeShot.composition.framing },
                    { label: "Lens",           value: activeShot.composition.lens_profile },
                    { label: "Movement",       value: activeShot.composition.camera_movement },
                    { label: "Focal Target",   value: activeShot.composition.focal_target },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-2 text-[9px] font-mono">
                      <span className="text-slate-500 shrink-0 w-20">{row.label}</span>
                      <span className="text-slate-200 leading-snug">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/10 bg-white/3 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">Performance Capture</span>
                  </div>
                  {[
                    { label: "Actor ID",      value: activeShot.performance_capture.primary_actor_id },
                    { label: "Kinetic Token", value: activeShot.performance_capture.active_kinetic_token },
                    { label: "Gaze Vector",   value: activeShot.performance_capture.gaze_vector },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-2 text-[9px] font-mono">
                      <span className="text-slate-500 shrink-0 w-20">{row.label}</span>
                      <span className="text-slate-200 leading-snug">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/10 bg-white/3 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Aperture className="w-3 h-3 text-purple-400" />
                    <span className="font-mono text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chroma &amp; Lighting</span>
                  </div>
                  {[
                    { label: "Key Light",   value: activeShot.chroma_and_lighting.key_lighting },
                    { label: "Env VFX",     value: activeShot.chroma_and_lighting.environmental_vfx },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-2 text-[9px] font-mono">
                      <span className="text-slate-500 shrink-0 w-20">{row.label}</span>
                      <span className="text-slate-200 leading-snug">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-blue-500/25 bg-blue-950/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] font-bold text-blue-300 uppercase tracking-widest">
                      Automated Image Prompt
                    </span>
                    <button
                      onClick={() => handleCopy(activeShot.automated_image_prompt)}
                      className="flex items-center gap-1 font-mono text-[8px] px-2 py-1 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <><CheckCheck className="w-2.5 h-2.5" /> Copied</>
                      ) : (
                        <><Copy className="w-2.5 h-2.5" /> Copy</>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-[9px] text-slate-300 leading-relaxed select-all">
                    {activeShot.automated_image_prompt}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
