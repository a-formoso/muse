import { useState, useRef, useEffect } from "react";
import { StoryOption, Character, Blueprint } from "../types";
import { getStoryCharacters, getStoryMeaning, getBlueprintSequences } from "../utils/schemaConverter";
import {
  Sparkles, RefreshCw, ArrowRight, Film,
  CheckCircle, AlertCircle, User, MapPin, Package, Plus, Lock, X,
  ChevronDown, ChevronRight, Eye, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await (supabase as any).auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { "Authorization": `Bearer ${token}` };
  } catch {}
  return {};
}

interface Phase4VisualsProps {
  selectedOption: StoryOption;
  blueprint?: Blueprint;
  onProceed: () => void;
  characterVariants: CharacterVariant[];
  onAddVariant: (v: CharacterVariant) => void;
}

export interface CharacterVariant {
  charId: string;
  variantId: string;
  label: string;
  arcStep: string;
}

type AssetTab = "characters" | "locations" | "props";

interface GeneratedAsset {
  id: string;
  status: "idle" | "waiting_key" | "generating" | "done" | "error";
  jobId?: string;
  imageUrl?: string;
  prompt?: string;
}

function withAspectRatio(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.includes("--ar")) return trimmed;
  return `${trimmed} --ar 16:9`;
}

function buildMasterGridPrompt(char: Character): string {
  const v = char.visuals;
  const id = char.identity;
  const height = id?.height || "170cm";
  const coreBody = v?.core_body || "";
  const texture = v?.material_texture || "";
  const outerMask = v?.wardrobe?.outer_mask || "";
  return `A master character design reference sheet for ${coreBody}, ${texture}, wearing ${outerMask}. The character is ${height} tall. 10-panel 5x2 grid. Top Row: Full-body Front View (0 deg), Full-body 3/4 Front View (45 deg), Full-body Profile View (90 deg), Full-body 3/4 Back View (135 deg), Full-body Back View (180 deg). Solid light grey background next to a vertical measurement bar positioned on the LEFT displaying markings for height in clear increments. Bottom Row: Close-up Neutral Front View (0 deg), Neutral Profile, Joy/Laughter (natural), Anger/Rage, Sadness/Grief. Consistent studio lighting, photorealistic, ultra high detail, film production reference quality.`;
}

export function Phase4Visuals({ selectedOption, blueprint, onProceed, characterVariants, onAddVariant }: Phase4VisualsProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("characters");
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [assets, setAssets] = useState<Record<string, GeneratedAsset>>({});
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const characters = getStoryCharacters(selectedOption);
  const meaning = getStoryMeaning(selectedOption);

  // Extract unique setting_macros from blueprint sequences, falling back to story setting dimensions
  const locations: { id: string; name: string; desc: string; visualDesc: string }[] = (() => {
    if (blueprint) {
      const seqMap = getBlueprintSequences(blueprint);
      const allSeqs = [
        ...(seqMap.act_one_sequences || []),
        ...(seqMap.act_two_sequences || []),
        ...(seqMap.act_three_sequences || []),
      ];
      const seen = new Set<string>();
      const locs: { id: string; name: string; desc: string; visualDesc: string }[] = [];
      allSeqs.forEach((seq, si) => {
        const macro = seq.setting_macro || "";
        if (macro && !seen.has(macro)) {
          seen.add(macro);
          const firstScene = seq.scenes?.[0];
          const visualDesc = (firstScene as any)?.visualDesc || seq.themeFocus || "";
          locs.push({
            id: `loc_seq_${si}`,
            name: macro,
            desc: seq.dramatic_arc || seq.themeFocus || "",
            visualDesc,
          });
        }
      });
      if (locs.length > 0) return locs;
    }
    const setting = selectedOption.setting?.dimensions || selectedOption.step_1_and_2_cosmology_and_actors?.dimensions;
    return setting ? [{ id: "loc_main", name: setting.location || "Primary Location", desc: setting.period + " — " + setting.conflict_level, visualDesc: "" }] : [];
  })();

  const props = meaning.props_sheet || [];

  useEffect(() => {
    return () => { Object.values(pollingRefs.current).forEach(clearInterval); };
  }, []);

  const startPolling = (assetId: string, jobId: string) => {
    if (pollingRefs.current[assetId]) clearInterval(pollingRefs.current[assetId]);
    pollingRefs.current[assetId] = setInterval(async () => {
      try {
        const resp = await fetch(`/api/job-status/${jobId}`);
        const data = await resp.json();
        if (data.status === "completed") {
          clearInterval(pollingRefs.current[assetId]);
          delete pollingRefs.current[assetId];
          setAssets(prev => ({
            ...prev,
            [assetId]: { ...prev[assetId]!, status: "done", imageUrl: data.result?.url || data.result?.image_url },
          }));
        } else if (data.status === "failed") {
          clearInterval(pollingRefs.current[assetId]);
          delete pollingRefs.current[assetId];
          setAssets(prev => ({ ...prev, [assetId]: { ...prev[assetId]!, status: "error" } }));
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  const generateAsset = async (assetId: string, rawPrompt: string, negativePrompt?: string) => {
    const prompt = withAspectRatio(rawPrompt);
    setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "generating", prompt } }));
    setApprovedIds(prev => { const next = new Set(prev); next.delete(assetId); return next; });
    try {
      const authHeader = await getAuthHeader();
      const resp = await fetch("/api/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ assetId, prompt, ...(negativePrompt ? { negativePrompt } : {}) }),
      });
      const data = await resp.json();
      if (data.success) {
        setApiKeyMissing(false);
        if (data.jobId && !data.imageUrl) {
          setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "generating", jobId: data.jobId, prompt } }));
          startPolling(assetId, data.jobId);
        } else {
          setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "done", jobId: data.jobId, imageUrl: data.imageUrl, prompt } }));
        }
      } else if (data.needsApiKey) {
        setApiKeyMissing(true);
        setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "waiting_key", prompt } }));
      } else {
        setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "error", prompt } }));
      }
    } catch {
      setAssets(prev => ({ ...prev, [assetId]: { id: assetId, status: "error", prompt } }));
    }
  };

  const approveAsset = (assetId: string) => {
    setApprovedIds(prev => { const next = new Set(prev); next.add(assetId); return next; });
  };

  const approvedCount = approvedIds.size;
  const totalAssets = characters.length + locations.length + props.length;

  const tabs: { id: AssetTab; label: string; icon: typeof User; count: number }[] = [
    { id: "characters", label: "Characters", icon: User, count: characters.length },
    { id: "locations", label: "Locations", icon: MapPin, count: locations.length },
    { id: "props", label: "Props", icon: Package, count: props.length },
  ];

  const charVariantsFor = (charId: string) => characterVariants.filter(v => v.charId === charId);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">Phase 4 — Visual Asset Generation</span>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Generate character reference sheets, location cards &amp; props via Higgsfield AI</p>
        </div>
        {apiKeyMissing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-700/40 bg-blue-950/20 text-blue-300 text-[10px] font-mono shrink-0">
            <Lock className="w-3 h-3" />
            Higgsfield API key pending activation
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-orange-500/70 bg-gradient-to-br from-[#0c0c10] to-[#08080a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/15 text-slate-300">Phase 04</span>
            <span className="font-mono text-[10px] text-slate-400">{approvedCount}/{totalAssets} assets approved</span>
          </div>
          <button
            onClick={onProceed}
            className="flex items-center gap-2 py-2 px-5 rounded-lg font-mono text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer shadow-md shadow-orange-950/40"
          >
            Proceed to Shot Generation
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex border border-white/15 rounded-lg overflow-hidden bg-black/50">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  i > 0 ? "border-l border-white/10" : ""
                } ${activeTab === tab.id ? "bg-white/15 text-white" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-black/50 border border-white/10 text-slate-500">{tab.count}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "characters" && (
              <motion.div key="chars" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {characters.length === 0 ? (
                  <EmptyState message="No characters found. Generate a story in Phase 1 first." />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {characters.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCharIdx(i)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer border shrink-0 ${
                            activeCharIdx === i
                              ? "bg-white/15 border-white/25 text-white"
                              : "bg-black/50 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {c.identity?.name || `Character ${i + 1}`}
                        </button>
                      ))}
                    </div>
                    {characters[activeCharIdx] && (
                      <CharacterAssetCard
                        char={characters[activeCharIdx]}
                        baseAsset={assets[characters[activeCharIdx].id]}
                        baseApproved={approvedIds.has(characters[activeCharIdx].id)}
                        variants={charVariantsFor(characters[activeCharIdx].id)}
                        variantAssets={assets}
                        variantApproved={approvedIds}
                        onGenerate={(id, prompt, negativePrompt) => generateAsset(id, prompt, negativePrompt)}
                        onApprove={approveAsset}
                        onAddVariant={(label, arcStep) => {
                          const char = characters[activeCharIdx];
                          const variantId = `${char.id}_v${charVariantsFor(char.id).length + 1}`;
                          onAddVariant({ charId: char.id, variantId, label, arcStep });
                        }}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "locations" && (
              <motion.div key="locs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {locations.length === 0 ? (
                  <EmptyState message="No locations extracted from story data." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {locations.map(loc => {
                      const locPrompt = [
                        `Cinematic establishing shot of ${loc.name}.`,
                        loc.desc ? loc.desc : "",
                        loc.visualDesc ? loc.visualDesc : "",
                        "Anamorphic 35mm lens, moody chiaroscuro lighting, photorealistic, ultra high detail, film production reference quality.",
                      ].filter(Boolean).join(" ");
                      return (
                        <AssetCard
                          key={loc.id}
                          label={loc.name}
                          sublabel={loc.desc}
                          asset={assets[loc.id]}
                          approved={approvedIds.has(loc.id)}
                          onGenerate={() => generateAsset(loc.id, locPrompt)}
                          onApprove={() => approveAsset(loc.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "props" && (
              <motion.div key="props" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {props.length === 0 ? (
                  <EmptyState message="No props found. Ensure Phase 1 has generated meaning data." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {props.map((prop, i) => {
                      const id = `prop_${i}`;
                      return (
                        <AssetCard
                          key={id}
                          label={prop.name}
                          sublabel={prop.description}
                          asset={assets[id]}
                          approved={approvedIds.has(id)}
                          onGenerate={() => generateAsset(id, `Product shot of "${prop.name}". ${prop.description}. Studio lighting, sharp focus, cinematic texture, 4K detail.`)}
                          onApprove={() => approveAsset(id)}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CharacterAssetCard({
  char, baseAsset, baseApproved, variants, variantAssets, variantApproved, onGenerate, onApprove, onAddVariant,
}: {
  char: Character;
  baseAsset?: GeneratedAsset;
  baseApproved: boolean;
  variants: CharacterVariant[];
  variantAssets: Record<string, GeneratedAsset>;
  variantApproved: Set<string>;
  onGenerate: (id: string, prompt: string, negativePrompt?: string) => void;
  onApprove: (id: string) => void;
  onAddVariant: (label: string, arcStep: string) => void;
}) {
  const [addingVariant, setAddingVariant] = useState(false);
  const [variantLabel, setVariantLabel] = useState("");
  const [variantArcStep, setVariantArcStep] = useState("");

  const basePrompt = char.prompts?.master_visual_reference?.master_grid_prompt
    ?? buildMasterGridPrompt(char);
  const negativePrompt = char.visuals?.negative_prompt || undefined;

  // Auto-detect arc state variants from master_grid_prompt_state2, state3, etc.
  const arcStateVariants: { stateKey: string; stateNum: number; prompt: string }[] = [];
  const ref = char.prompts?.master_visual_reference as Record<string, string | undefined> | undefined;
  if (ref) {
    let i = 2;
    while (ref[`master_grid_prompt_state${i}`]) {
      arcStateVariants.push({
        stateKey: `master_grid_prompt_state${i}`,
        stateNum: i,
        prompt: ref[`master_grid_prompt_state${i}`]!,
      });
      i++;
    }
  }

  const confirmVariant = () => {
    if (!variantLabel.trim()) return;
    onAddVariant(variantLabel.trim(), variantArcStep.trim());
    setVariantLabel(""); setVariantArcStep(""); setAddingVariant(false);
  };

  return (
    <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-5">
      <ReferenceGrid
        title={`${char.identity?.name || "Character"} — Base Reference`}
        subtitle={char.identity?.cast_orbit}
        description={char.prompts?.master_visual_reference?.core_keywords_used || char.visuals?.core_body}
        assetId={char.id}
        asset={baseAsset}
        approved={baseApproved}
        prompt={basePrompt}
        negativePrompt={negativePrompt}
        onGenerate={onGenerate}
        onApprove={onApprove}
      />

      {/* Arc state variants — auto-detected from master_grid_prompt_state2/3/etc. */}
      {arcStateVariants.map(sv => {
        const assetId = `${char.id}_arc_state${sv.stateNum}`;
        const arcLabel = `Arc State ${sv.stateNum} — ${char.arc?.step_3_change || "Post-transition"}`;
        return (
          <div key={sv.stateKey} className="border-t border-white/8 pt-5">
            <ReferenceGrid
              title={`${char.identity?.name || "Character"} — State ${sv.stateNum}`}
              subtitle={arcLabel}
              description={char.arc?.step_3_change}
              assetId={assetId}
              asset={variantAssets[assetId]}
              approved={variantApproved.has(assetId)}
              prompt={sv.prompt}
              negativePrompt={negativePrompt}
              onGenerate={onGenerate}
              onApprove={onApprove}
              isVariant
            />
          </div>
        );
      })}

      {/* User-added state variants */}
      {variants.map(v => {
        const variantPrompt = `${basePrompt}. STATE VARIANT: ${v.label}. Arc change: ${v.arcStep}. Maintain same character identity with adjusted wardrobe/expression/physical state.`;
        return (
          <div key={v.variantId} className="border-t border-white/8 pt-5">
            <ReferenceGrid
              title={`Variant: ${v.label}`}
              subtitle={v.arcStep}
              description={`Arc change: ${v.arcStep}`}
              assetId={v.variantId}
              asset={variantAssets[v.variantId]}
              approved={variantApproved.has(v.variantId)}
              prompt={variantPrompt}
              negativePrompt={negativePrompt}
              onGenerate={onGenerate}
              onApprove={onApprove}
              isVariant
            />
          </div>
        );
      })}

      <div className="border-t border-white/8 pt-3">
        {!addingVariant ? (
          <button
            onClick={() => setAddingVariant(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/20 hover:border-white/35 bg-white/3 hover:bg-white/5 text-[10px] text-slate-400 hover:text-white font-mono font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add state variant
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-white/15 bg-white/5 p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider font-bold">New State Variant</span>
              <button onClick={() => setAddingVariant(false)} className="cursor-pointer text-slate-600 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              autoFocus
              value={variantLabel}
              onChange={e => setVariantLabel(e.target.value)}
              placeholder="Variant name — e.g. Post-injury, Act III wardrobe"
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              value={variantArcStep}
              onChange={e => setVariantArcStep(e.target.value)}
              placeholder="Arc step — e.g. After the poisoning attempt, blood on jacket"
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAddingVariant(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] text-slate-400 font-mono cursor-pointer hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmVariant}
                disabled={!variantLabel.trim()}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-[10px] text-white font-mono font-bold cursor-pointer transition-all"
              >
                Create Variant
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ReferenceGrid({
  title, subtitle, description, assetId, asset, approved, prompt, negativePrompt, onGenerate, onApprove, isVariant = false,
}: {
  title: string; subtitle?: string; description?: string;
  assetId: string; asset?: GeneratedAsset; approved: boolean; prompt: string; negativePrompt?: string;
  onGenerate: (id: string, prompt: string, negativePrompt?: string) => void;
  onApprove: (id: string) => void;
  isVariant?: boolean;
}) {
  const status = asset?.status ?? "idle";
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [promptOverride, setPromptOverride] = useState(prompt);
  const [negOverride, setNegOverride] = useState(negativePrompt ?? "");
  const promptDirty = promptOverride !== prompt;
  const negDirty = negOverride !== (negativePrompt ?? "");

  const handleReset = () => {
    setPromptOverride(prompt);
    setNegOverride(negativePrompt ?? "");
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle && (
            <span className={`text-[9px] font-mono uppercase tracking-widest block mb-0.5 ${isVariant ? "text-violet-400" : "text-slate-400"}`}>
              {subtitle}
            </span>
          )}
          <h4 className={`font-bold text-sm ${isVariant ? "text-violet-200" : "text-white"}`}>{title}</h4>
          {description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{description}</p>}
        </div>

        <button
          onClick={() => onGenerate(assetId, promptOverride, negOverride || undefined)}
          disabled={status === "generating"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white font-mono font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
            isVariant ? "bg-violet-700 hover:bg-violet-600" : "bg-orange-600 hover:bg-orange-500"
          }`}
        >
          {status === "generating" ? (
            <><RefreshCw className="w-3 h-3 animate-spin" />Generating…</>
          ) : (status === "done" || status === "error") ? (
            <><RefreshCw className="w-3 h-3" />Regenerate</>
          ) : (
            <><Sparkles className="w-3 h-3" />Generate 5×2 Grid</>
          )}
        </button>
      </div>

      {/* Single wide image container */}
      <div className={`w-full rounded-xl border overflow-hidden transition-all ${
        status === "done" && approved ? "border-emerald-500/50"
        : status === "done" ? "border-orange-500/30"
        : status === "generating" ? "border-orange-500/20"
        : status === "waiting_key" ? "border-blue-800/30"
        : status === "error" ? "border-red-800/30"
        : "border-white/8"
      }`}>
        {status === "done" && asset?.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={`${title} reference sheet`}
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        ) : (
          <div
            className={`w-full flex flex-col items-center justify-center gap-3 transition-all ${
              status === "generating" ? "bg-orange-950/10 animate-pulse"
              : status === "waiting_key" ? "bg-blue-950/10"
              : status === "error" ? "bg-red-950/10"
              : "bg-black/40"
            }`}
            style={{ aspectRatio: "16/9" }}
          >
            {status === "generating" && (
              <>
                <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] font-mono text-orange-400">Rendering reference sheet…</p>
                  <p className="text-[9px] font-mono text-slate-600">Polling Higgsfield every 3s</p>
                </div>
              </>
            )}
            {status === "waiting_key" && (
              <>
                <Lock className="w-6 h-6 text-blue-500/40" />
                <p className="text-[10px] font-mono text-blue-400">Waiting for API key activation</p>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="w-6 h-6 text-red-500/60" />
                <p className="text-[10px] font-mono text-red-400">Generation failed — press Regenerate to retry</p>
              </>
            )}
            {(status === "idle" || status === "done") && (
              <>
                <Film className="w-8 h-8 text-slate-700" />
                <p className="text-[10px] font-mono text-slate-600">
                  {status === "done" ? "Image received — no preview URL returned" : "Press Generate 5×2 Grid to render"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Row labels */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 px-0.5">
        <span>Row 1 — Full-body poses (5 angles)</span>
        <span>Row 2 — Headshots (5 expressions)</span>
      </div>

      {/* Prompt Inspector */}
      <div className="rounded-lg border border-white/8 overflow-hidden">
        <button
          onClick={() => setInspectorOpen(v => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/3 hover:bg-white/6 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            {inspectorOpen
              ? <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
              : <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            }
            <Eye className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors font-bold">
              Prompt Inspector
            </span>
            {(promptDirty || negDirty) && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                overridden
              </span>
            )}
          </div>
          <span className="font-mono text-[9px] text-slate-600 group-hover:text-slate-400 transition-colors">
            {inspectorOpen ? "hide" : "inspect & override"}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {inspectorOpen && (
            <motion.div
              key="inspector"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 py-3 space-y-3 border-t border-white/8 bg-black/30">
                {/* Positive prompt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                      Prompt — sent to Higgsfield
                    </label>
                    {promptDirty && (
                      <button
                        onClick={() => setPromptOverride(prompt)}
                        className="flex items-center gap-1 text-[9px] font-mono text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        restore
                      </button>
                    )}
                  </div>
                  <textarea
                    value={promptOverride}
                    onChange={e => setPromptOverride(e.target.value)}
                    rows={5}
                    spellCheck={false}
                    className={`w-full bg-black/60 rounded-lg px-3 py-2.5 text-[10px] font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 transition-all ${
                      promptDirty
                        ? "border border-amber-500/40 text-amber-100 focus:ring-amber-500/50"
                        : "border border-white/8 text-slate-300 focus:ring-orange-500/40"
                    }`}
                  />
                </div>

                {/* Negative prompt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                      Negative Prompt
                    </label>
                    {negDirty && (
                      <button
                        onClick={() => setNegOverride(negativePrompt ?? "")}
                        className="flex items-center gap-1 text-[9px] font-mono text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        restore
                      </button>
                    )}
                  </div>
                  <textarea
                    value={negOverride}
                    onChange={e => setNegOverride(e.target.value)}
                    rows={2}
                    spellCheck={false}
                    placeholder="No negative prompt defined — type here to add one"
                    className={`w-full bg-black/60 rounded-lg px-3 py-2.5 text-[10px] font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 transition-all placeholder:text-slate-700 ${
                      negDirty
                        ? "border border-amber-500/40 text-amber-100 focus:ring-amber-500/50"
                        : "border border-white/8 text-slate-300 focus:ring-orange-500/40"
                    }`}
                  />
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-[9px] font-mono text-slate-600">
                    Edits apply only to the next generation — they don't affect the source data.
                  </p>
                  {(promptDirty || negDirty) && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Reset all
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approve / action row */}
      {(status === "done") && (
        <div className="flex items-center gap-2">
          {approved ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-[10px] text-emerald-400 font-mono font-bold">
              <CheckCircle className="w-3 h-3" />
              Approved
            </div>
          ) : (
            <button
              onClick={() => onApprove(assetId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-950/10 hover:bg-emerald-950/25 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold transition-all cursor-pointer"
            >
              <CheckCircle className="w-3 h-3" />
              Approve
            </button>
          )}
          <span className="text-[9px] font-mono text-slate-600">
            {approved ? "Added to production pipeline" : "Approve to add to production pipeline"}
          </span>
        </div>
      )}
    </div>
  );
}

function AssetCard({
  label, sublabel, asset, approved, onGenerate, onApprove,
}: {
  label: string; sublabel: string; asset?: GeneratedAsset; approved: boolean;
  onGenerate: () => void; onApprove: () => void;
}) {
  const status = asset?.status ?? "idle";
  return (
    <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm truncate">{label}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{sublabel}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={status === "generating"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-[10px] text-white font-mono font-bold transition-all cursor-pointer shrink-0"
        >
          {status === "generating" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {status === "generating" ? "…" : (status === "done" || status === "error") ? "Regen" : "Generate"}
        </button>
      </div>

      <div
        className={`w-full rounded-lg border flex flex-col items-center justify-center gap-2 transition-all overflow-hidden ${
          status === "done" && asset?.imageUrl ? "border-white/10"
          : status === "done" ? "border-emerald-500/40 bg-emerald-950/20"
          : status === "generating" ? "border-orange-500/30 bg-orange-950/10 animate-pulse"
          : status === "waiting_key" ? "border-blue-800/30 bg-blue-950/10"
          : status === "error" ? "border-red-800/30 bg-red-950/10"
          : "border-white/8 bg-white/3"
        }`}
        style={{ aspectRatio: "16/9" }}
      >
        {status === "done" && asset?.imageUrl ? (
          <img src={asset.imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : status === "done" ? (
          <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-[9px] font-mono text-emerald-400">Asset ready</span></>
        ) : status === "generating" ? (
          <><div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" /><span className="text-[9px] font-mono text-orange-400">Rendering…</span></>
        ) : status === "waiting_key" ? (
          <><Lock className="w-4 h-4 text-blue-500/50" /><span className="text-[9px] font-mono text-blue-400">Waiting for API key</span></>
        ) : status === "error" ? (
          <><AlertCircle className="w-4 h-4 text-red-500/70" /><span className="text-[9px] font-mono text-red-400">Failed</span></>
        ) : (
          <Film className="w-6 h-6 text-slate-700" />
        )}
      </div>

      {status === "done" && (
        <div className="flex items-center gap-2">
          {approved ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-[9px] text-emerald-400 font-mono font-bold">
              <CheckCircle className="w-2.5 h-2.5" />
              Approved
            </div>
          ) : (
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-600/40 bg-emerald-950/10 hover:bg-emerald-950/25 text-[9px] text-emerald-400 font-mono font-bold transition-all cursor-pointer"
            >
              <CheckCircle className="w-2.5 h-2.5" />
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-10 flex flex-col items-center justify-center gap-2 text-center">
      <Film className="w-6 h-6 text-slate-700" />
      <p className="text-slate-600 font-mono text-[10px] italic">{message}</p>
    </div>
  );
}
