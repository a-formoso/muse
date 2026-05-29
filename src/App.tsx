import { useState, useEffect, useCallback, useRef } from "react";
import { StoryOption, Blueprint } from "./types";
import { PRESEEDED_OPTIONS, PRESEEDED_BLUEPRINT, PRESEEDED_SCRIPT } from "./preseededData";
import { Phase1Discovery } from "./components/Phase1Discovery";
import { Phase2Blueprint } from "./components/Phase2Blueprint";
import { Phase3Script } from "./components/Phase3Script";
import { Phase4Visuals, type CharacterVariant } from "./components/Phase4Visuals";
import { Phase5Shots } from "./components/Phase5Shots";
import { Phase6Assembly } from "./components/Phase6Assembly";
import { LandingPage } from "./components/LandingPage";
import { UpgradeWall } from "./components/UpgradeWall";
import { ProductionsMenu } from "./components/ProductionsMenu";
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { saveProduction, type Production } from "./lib/productions";
import { usageLabel, isLimitReached, canAccessPhase } from "./lib/accessTier";
import { PhaseUpsell } from "./components/PhaseUpsell";
import { motion, AnimatePresence } from "motion/react";
import { PanelRightOpen, PanelRightClose, LogOut, AlertTriangle, Sun, Moon } from "lucide-react";
import { ServiceStatus } from "./components/ServiceStatus";
import { useTheme } from "./context/ThemeContext";

type Phase = 1 | 2 | 3 | 4 | 5 | 6;
type AppView = "landing" | "app" | "upgrade";

const PHASES = [
  { id: 1, label: "Discovery",  short: "01", desc: "Idea → Direction" },
  { id: 2, label: "Blueprint",  short: "02", desc: "Acts & Beats" },
  { id: 3, label: "Screenplay", short: "03", desc: "Script Output" },
  { id: 4, label: "Visuals",    short: "04", desc: "Char & Locations" },
  { id: 5, label: "Shots",      short: "05", desc: "Storyboard" },
  { id: 6, label: "Assembly",   short: "06", desc: "Export" },
];

const PHASE_TO_STATUS: Record<Phase, Production["status"]> = {
  1: "discovery", 2: "blueprint", 3: "screenplay",
  4: "visuals", 5: "shots", 6: "assembly",
};

export default function App() {
  const { user, loading, accessTier, usage, signOut, refreshAccess } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  // View routing
  const [view, setView] = useState<AppView>("landing");

  // Production state
  const [activePhase, setActivePhase] = useState<Phase>(1);
  const [selectedOption, setSelectedOption] = useState<StoryOption>(PRESEEDED_OPTIONS[0]);
  const [lockedOptionId, setLockedOptionId] = useState<number>(PRESEEDED_OPTIONS[0].option_id);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint>(PRESEEDED_BLUEPRINT);
  const [scriptText, setScriptText] = useState<string>(PRESEEDED_SCRIPT);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [characterVariants, setCharacterVariants] = useState<CharacterVariant[]>([]);
  const [productionId, setProductionId] = useState<string | null>(null);
  const [productionTitle, setProductionTitle] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-save ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Routing logic ──
  useEffect(() => {
    if (loading) return;
    if (!user) { setView("landing"); return; }
    const tier = accessTier.tier;
    if (tier === "none") { setView("upgrade"); return; }
    setView("app");
  }, [user, loading, accessTier]);

  // ── Auto-save helper ──
  const scheduleSave = useCallback((phase: Phase, overrides: Partial<Parameters<typeof saveProduction>[2]> = {}) => {
    if (!user) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const title = productionTitle || selectedOption?.title || "Untitled Production";
      const newId = await saveProduction(user.id, productionId, {
        title,
        status: PHASE_TO_STATUS[phase],
        story_data: selectedOption,
        blueprint_data: selectedBlueprint,
        screenplay_text: scriptText,
        ...overrides,
      });
      if (newId && !productionId) setProductionId(newId);
    }, 1200);
  }, [user, productionId, productionTitle, selectedOption, selectedBlueprint, scriptText]);

  // ── Resume production ──
  const handleResume = useCallback((prod: Production) => {
    setProductionId(prod.id);
    setProductionTitle(prod.title || "");
    if (prod.story_data) setSelectedOption(prod.story_data);
    if (prod.blueprint_data) setSelectedBlueprint(prod.blueprint_data);
    if (prod.screenplay_text) setScriptText(prod.screenplay_text);
    const phaseMap: Record<Production["status"], Phase> = {
      discovery: 1, blueprint: 2, screenplay: 3, visuals: 4, shots: 5, assembly: 6,
    };
    setActivePhase(phaseMap[prod.status] ?? 1);
    setView("app");
  }, []);

  // ── New production ──
  const handleNew = useCallback(() => {
    setProductionId(null);
    setProductionTitle("");
    setSelectedOption(PRESEEDED_OPTIONS[0]);
    setLockedOptionId(PRESEEDED_OPTIONS[0].option_id);
    setSelectedBlueprint(PRESEEDED_BLUEPRINT);
    setScriptText(PRESEEDED_SCRIPT);
    setCharacterVariants([]);
    setActivePhase(1);
    setView("app");
  }, []);

  // ── Characters helper ──
  const getDisplayCharacters = (option: StoryOption) => {
    if (!option) return [];
    if (option.characters && Array.isArray(option.characters)) {
      return (option.characters as any[]).map(c => ({
        name: c.identity?.name || c.name || "Character",
        role: c.identity?.archetype || c.role || "Role"
      }));
    }
    const sheets = option.step_1_and_2_cosmology_and_actors?.character_sheets || [];
    return sheets.map(s => ({ name: s.name || "Character", role: s.role || "Role" }));
  };

  const handleSelectOption = (option: StoryOption) => {
    setSelectedOption(option);
    const charsList = option.characters && Array.isArray(option.characters)
      ? (option.characters as any[]).map(c => ({
          name: c.identity?.name || c.name || "Character",
          role: c.identity?.archetype || c.role || "Role",
          characterization: c.visuals?.core_body || c.characterization || "",
          true_character: c.psychology?.core || c.true_character || "",
          conscious_desire: c.motivation?.conscious_desire || c.conscious_desire || "",
          unconscious_desire: c.motivation?.unconscious_need || c.unconscious_desire || ""
        }))
      : (option.step_1_and_2_cosmology_and_actors?.character_sheets || []).map(c => ({
          name: c.name || "Character", role: c.role || "Role",
          characterization: c.characterization || "", true_character: c.true_character || "",
          conscious_desire: c.conscious_desire || "", unconscious_desire: c.unconscious_desire || ""
        }));

    const locDim = option.setting?.dimensions || option.step_1_and_2_cosmology_and_actors?.dimensions || {
      period: "Near-future", duration: "15 minutes", location: "Rooftop Bio-Dome Penthouse", conflict_level: "High Conflict"
    };
    const creativeLimitation = option.setting?.creative_limitation || option.step_1_and_2_cosmology_and_actors?.creative_limitation || "Confined inside greenhouse";
    const propsList = option.meaning?.props_sheet || option.step_3_and_4_meaning_and_props?.props_sheet || [];

    const matchedBlueprint: Blueprint = { ...PRESEEDED_BLUEPRINT };
    matchedBlueprint.title = option.title;
    matchedBlueprint.setting = option.setting || { dimensions: locDim, creative_limitation: creativeLimitation };
    matchedBlueprint.meaning = option.meaning || {
      controlling_idea: option.step_3_and_4_meaning_and_props?.controlling_idea || "",
      dialectical_debate: option.step_3_and_4_meaning_and_props?.dialectical_debate || { positive_idea: "", negative_counter_idea: "" },
      props_sheet: propsList
    };
    matchedBlueprint.characters = option.characters || [];
    matchedBlueprint.step_1_and_2_cosmology_and_actors = { dimensions: locDim, creative_limitation: creativeLimitation, character_sheets: charsList };
    matchedBlueprint.step_3_and_4_meaning_and_props = {
      premise: option.meaning?.premise || option.step_3_and_4_meaning_and_props?.premise || "",
      controlling_idea: option.meaning?.controlling_idea || option.step_3_and_4_meaning_and_props?.controlling_idea || "",
      dialectical_debate: option.meaning?.dialectical_debate || option.step_3_and_4_meaning_and_props?.dialectical_debate || { positive_idea: "", negative_counter_idea: "" },
      props_sheet: propsList
    };

    if (option.option_id !== 1) {
      const char1 = charsList[0] || { name: "Saboteur", role: "Saboteur" };
      const char2 = charsList[1] || { name: "Target", role: "Target" };
      const prop1 = propsList?.[0] || { name: "Device", description: "device" };
      const prop2 = propsList?.[1] || { name: "Interface", description: "interface" };
      matchedBlueprint.step_5a_sequence_map = {
        act_one_sequences: [{ sequence_id: "A1_S1", act: "ACT ONE", actLabel: "Set-Up", title: "Establishing the Trap", setting_macro: `${locDim.location || "Sanctuary"} - Night`, themeFocus: "Control - Isolation", dramatic_arc: "Establishing harmony shifting to tension.", scenes: [{ scene_number: 1, setting_micro: `Near the ${prop1.name}`, scene_objective: `Establish comfort and introduce ${prop1.name}.`, opening_value: "Polite Concord", closing_value: "Subtle Apprehension", narrative_action: `${char1.name} prepares the ${prop1.name}.`, visualDesc: creativeLimitation }] }],
        act_two_sequences: [{ sequence_id: "A2_S1", act: "ACT TWO", actLabel: "Confrontation", title: "The Climactic Test", setting_macro: locDim.location || "Sanctuary", themeFocus: "Tension - Exposure", dramatic_arc: "Environment exposes the internal physiological lie.", scenes: [{ scene_number: 2, setting_micro: `Sensing biometrics via ${prop2.name}`, scene_objective: `${char1.name} executes the move while ${char2.name} probes.`, opening_value: "Protected Mask", closing_value: "Severe Exposure", narrative_action: `Automated scanner flares with color shifts.`, visualDesc: `Bioluminescence reactive to heart rate.` }] }],
        act_three_sequences: [{ sequence_id: "A3_S1", act: "ACT THREE", actLabel: "Resolution", title: "The Swapped Toast", setting_macro: locDim.location || "Sanctuary", themeFocus: "Sovereignty Reclaimed", dramatic_arc: "Sovereignty reclaimed through fatal choice.", scenes: [{ scene_number: 3, setting_micro: "Final standoff", scene_objective: "Clinical standoff resolved through tragic exchange.", opening_value: "Controlled Lock", closing_value: "Sovereign Expiation", narrative_action: `${char1.name} and ${char2.name} decide their fates.`, visualDesc: `Bioluminescent feedback reflecting consequences.` }] }]
      };
      matchedBlueprint.step_5b_subtextual_beat_sheets = [
        { target_sequence_id: "A1_S1", scene_number: 1, micro_blueprint: { scene_objective: `Settle into role with ${prop1.name}`, opening_value: "Stable", closing_value: "Tension", subtextual_beat_progression: [{ beat_number: 1, action: `${char1.name}: Concealing tremors near ${prop1.name}.`, reaction: `${char2.name}: Rotating accessories, testing boundaries.`, text: `This environment represents our future. Trust what is automated.`, status: "Superficial harmony. Heartrate 74bpm.", visual_flora: "Flora steady pale lavender." }, { beat_number: 2, action: `${char1.name}: Quietly shifting ${prop1.name}.`, reaction: `${char2.name}: Locking eyes directly.`, text: `Automated designs have zero sense of guilt. Human intentions are far more fragile.`, status: "Tension creeps. Heartrate 94bpm.", visual_flora: "Canopy orchids turn deep violet." }] } },
        { target_sequence_id: "A2_S1", scene_number: 2, micro_blueprint: { scene_objective: "Force the chemical exchange.", opening_value: "Standoff", closing_value: "Collapse", subtextual_beat_progression: [{ beat_number: 3, action: `${char1.name}: Manipulating vents near ${prop2.name}.`, reaction: `${char2.name}: Accessing bio-filters.`, text: "Let us drink from the same source. Where does your loyalty reside?", status: "Panic registered. Heartrate 114bpm.", visual_flora: "Environmental systems erupt in blazing orange mist." }] } },
        { target_sequence_id: "A3_S1", scene_number: 3, micro_blueprint: { scene_objective: "Complete the exchange.", opening_value: "Tragedy", closing_value: "Sovereignty", subtextual_beat_progression: [{ beat_number: 4, action: `${char1.name}: Exhaling, choosing self-sacrifice.`, reaction: `${char2.name}: Accepting swapped vessels.`, text: "To clear coordinates, free from corporate filters. We go together.", status: "Final resolution. Heartrate 132bpm.", visual_flora: "Bulkhead sensors explode in defensive crimson petals!" }] } }
      ];
      matchedBlueprint.step_6_master_logline = `Sealed inside the ${locDim.location}, ${char1.role} ${char1.name} uses the ${prop1.name} against ${char2.name}, triggering biometric sensors that write secrets in the environment above.`;
    }
    setSelectedBlueprint(matchedBlueprint);
  };

  const handleLockOption = (option: StoryOption) => {
    handleSelectOption(option);
    setLockedOptionId(option.option_id);
    setActivePhase(2);
    scheduleSave(2, { story_data: option });
  };

  const handleSelectBlueprint = (blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint);
    setActivePhase(3);
    scheduleSave(3, { blueprint_data: blueprint });
  };

  const handleProceedToVisuals = async () => {
    setActivePhase(4);
    scheduleSave(4, { screenplay_text: scriptText });

    // Mark trial as used once the user completes Phase 3 (screenplay)
    // This is the gate — after this point, they must subscribe to create another production.
    if (user && accessTier.tier === "trial") {
      await supabase
        .from("user_profiles")
        .update({ studio_trial_used: true })
        .eq("id", user.id);
      // Refresh access so next session shows upgrade wall instead of trial
      refreshAccess();
    }
  };

  const handleProceedToShots = () => {
    setActivePhase(5);
    scheduleSave(5);
  };

  const handleProceedToAssembly = () => {
    setActivePhase(6);
    scheduleSave(6);
  };

  const stressLevel = selectedOption?.option_id === 3 ? 88 : selectedOption?.option_id === 2 ? 58 : 32;
  const stressColor = stressLevel >= 80 ? "bg-red-500" : stressLevel >= 50 ? "bg-amber-500" : "bg-emerald-500";

  // ── Usage pill color ──
  const shotLimit = accessTier.shot_generations_limit;
  const shotUsed = usage.shot_generations_used;
  const shotAtLimit = isLimitReached(shotUsed, shotLimit);
  const shotNearLimit = !shotAtLimit && shotLimit !== null && shotUsed >= shotLimit * 0.8;

  // ── Loading splash ──
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#FF3D00] rounded-sm animate-pulse" />
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Loading…</span>
        </div>
      </div>
    );
  }

  // ── Landing ──
  if (view === "landing") {
    return <LandingPage onAuthenticated={() => setView("app")} />;
  }

  // ── Upgrade wall ──
  if (view === "upgrade") {
    return <UpgradeWall />;
  }

  // ── Main App ──
  return (
    <div className="h-screen overflow-hidden flex flex-col font-sans select-text" style={{ background: "var(--bg-app)", color: "var(--text-base)" }}>
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-orange-950/5 to-transparent pointer-events-none z-0" />

      <div className="w-full max-w-7xl mx-auto my-3 border rounded-2xl flex flex-col z-10 relative overflow-hidden" style={{ height: "calc(100vh - 24px)", background: "var(--bg-app)", borderColor: "var(--border)", boxShadow: "var(--shadow-main)" }}>

        {/* ── Nav Header ── */}
        <nav className="h-14 flex items-center justify-between px-5 backdrop-blur-md shrink-0 gap-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-nav)" }}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 bg-[#FF3D00] rounded-sm flex items-center justify-center font-bold text-white text-xs tracking-tighter">IS</div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-bold tracking-widest uppercase text-white leading-none">Infinite Studio</h1>
              <p className="text-[9px] text-[#FF3D00] uppercase tracking-widest leading-none mt-0.5">Muse</p>
            </div>
          </div>

          {/* Phase progress bar */}
          <div className="flex-1 flex items-center justify-center gap-1 min-w-0 overflow-x-auto">
            {PHASES.map((p, i) => {
              const isDone = (activePhase as number) > p.id;
              const isActive = activePhase === p.id;
              return (
                <div key={p.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setActivePhase(p.id as Phase)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive ? "bg-[#FF3D00] text-white" :
                      isDone ? "bg-white/10 text-emerald-400 hover:bg-white/15" :
                      "bg-white/3 text-slate-600 hover:bg-white/8 hover:text-slate-400"
                    }`}
                  >
                    <span>{p.short}</span>
                    <span className="hidden md:inline">{p.label}</span>
                  </button>
                  {i < PHASES.length - 1 && (
                    <div className={`w-4 h-px ${isDone ? "bg-emerald-500/40" : "bg-white/8"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark"
                ? <Sun className="w-3.5 h-3.5 text-slate-400" />
                : <Moon className="w-3.5 h-3.5 text-slate-400" />
              }
            </button>

            {/* Usage pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-colors ${
              shotAtLimit ? "border-red-500/40 bg-red-500/10 text-red-400" :
              shotNearLimit ? "border-amber-500/40 bg-amber-500/10 text-amber-400" :
              "border-white/8 bg-white/3 text-slate-500"
            }`}>
              {(shotAtLimit || shotNearLimit) && <AlertTriangle className="w-2.5 h-2.5" />}
              <span>Shots {usageLabel(shotUsed, shotLimit)}</span>
            </div>

            {/* Tier badge */}
            {accessTier.tier !== "none" && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full border border-white/8 bg-white/3 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                {accessTier.tier === "trial" && "Trial"}
                {accessTier.tier === "playwright" && "Playwright"}
                {accessTier.tier === "director" && <span className="text-blue-400">Director</span>}
                {accessTier.tier === "studio" && <span className="text-[#FF3D00]">Studio</span>}
              </div>
            )}

            {/* Productions menu */}
            {user && (
              <ProductionsMenu
                onResume={handleResume}
                onNew={handleNew}
              />
            )}

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              title={sidebarOpen ? "Collapse sidebar" : "Expand data sidebar"}
            >
              {sidebarOpen
                ? <PanelRightClose className="w-3.5 h-3.5 text-slate-400" />
                : <PanelRightOpen className="w-3.5 h-3.5 text-slate-400" />
              }
            </button>

            {/* Sign out */}
            {user && (
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                title={`Sign out (${user.email})`}
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </nav>

        {/* ── Limit Banner ── */}
        {shotAtLimit && (
          <div className="bg-red-950/40 border-b border-red-800/30 px-5 py-2 flex items-center justify-between text-[10px] font-mono text-red-400">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Shot generation limit reached ({shotLimit}/{shotLimit} used this month).
            </span>
            <a href="https://infinitestudioai.com/membership" target="_blank" rel="noreferrer" className="text-[#FF3D00] hover:underline">
              Upgrade →
            </a>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Sidebar: Phase number nav */}
          <aside className="w-full md:w-14 flex md:flex-col items-center py-3 md:py-6 justify-around md:justify-start gap-3 md:gap-8 shrink-0" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
            {PHASES.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id as Phase)}
                className={`group relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  activePhase === p.id
                    ? "border-[#FF3D00]/50 bg-[#FF3D00]/10 text-[#FF3D00]"
                    : (activePhase as number) > p.id
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
                    : "border-white/10 bg-white/5 text-slate-600 hover:border-white/20 hover:text-slate-400"
                }`}
              >
                <span className="text-[10px] font-bold">{p.short}</span>
                <div className="absolute left-11 top-1/2 -translate-y-1/2 px-2 py-1 bg-black border border-white/10 text-[9px] uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 rounded shadow-md pointer-events-none">
                  {p.label}
                </div>
              </button>
            ))}

            <div className="hidden md:flex flex-col items-center gap-3 mt-auto mb-2">
              {/* AI service indicators */}
              <ServiceStatus compact />

              {/* Progress bar */}
              <div className="w-0.5 h-16 bg-white/5 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 w-full bg-[#FF3D00]/60 transition-all duration-500"
                  style={{ height: `${((activePhase - 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          </aside>

          {/* Main workspace */}
          <main className={`flex-1 overflow-hidden flex ${sidebarOpen ? "flex-col lg:flex-row" : ""}`}>
            {/* Primary content */}
            <section className={`flex-1 p-5 flex flex-col gap-5 overflow-y-auto min-h-[400px] ${sidebarOpen ? "lg:border-r" : ""}`} style={{ background: "var(--bg-panel)", ...(sidebarOpen ? { borderRightColor: "var(--border)" } : {}) }}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono font-bold mb-0.5 block">
                    {PHASES.find(p => p.id === activePhase)?.label}
                  </span>
                  <h2 className="text-xl font-light text-white tracking-tight">
                    {(activePhase <= 3) ? (selectedOption?.title || "Story Blueprint Engine") : PHASES.find(p => p.id === activePhase)?.desc}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {activePhase <= 3 && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase block">Active Target</span>
                      <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase">OPTION-0{selectedOption?.option_id || 1}</span>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activePhase}-${accessTier.tier}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Phase gate: playwright/trial users are blocked at Phase 4+ */}
                  {!canAccessPhase(accessTier, activePhase) ? (
                    <PhaseUpsell currentPhase={activePhase} />
                  ) : (
                    <>
                      {activePhase === 1 && (
                        <Phase1Discovery
                          onSelectOption={handleSelectOption}
                          onLockOption={handleLockOption}
                          selectedOptionId={selectedOption?.option_id}
                          lockedOptionId={lockedOptionId}
                        />
                      )}
                      {activePhase === 2 && (
                        <Phase2Blueprint
                          chosenOption={selectedOption}
                          onSelectBlueprint={handleSelectBlueprint}
                          selectedBlueprint={selectedBlueprint}
                        />
                      )}
                      {activePhase === 3 && (
                        <Phase3Script
                          blueprint={selectedBlueprint}
                          selectedScriptText={scriptText}
                          onUpdateScriptText={setScriptText}
                          onProceedToVisuals={handleProceedToVisuals}
                        />
                      )}
                      {activePhase === 4 && (
                        <Phase4Visuals
                          selectedOption={selectedOption}
                          blueprint={selectedBlueprint}
                          onProceed={handleProceedToShots}
                          characterVariants={characterVariants}
                          onAddVariant={(v) => setCharacterVariants(prev => [...prev, v])}
                        />
                      )}
                      {activePhase === 5 && (
                        <Phase5Shots
                          blueprint={selectedBlueprint}
                          onProceed={handleProceedToAssembly}
                          characterVariants={characterVariants}
                        />
                      )}
                      {activePhase === 6 && (
                        <Phase6Assembly
                          blueprint={selectedBlueprint}
                          onBack={() => setActivePhase(5)}
                        />
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>

            {/* Collapsible data sidebar */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden border-t lg:border-t-0"
                  style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
                >
                  <div className="w-[280px] p-4 flex flex-col gap-4 h-full overflow-y-auto">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Session · Data Panel</span>

                    {/* User info */}
                    {user && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Account</span>
                        <p className="text-[10px] font-mono text-white truncate">{user.email}</p>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>Tier: <span className="text-[#FF3D00] uppercase">{accessTier.tier}</span></span>
                          {productionId && <span className="text-emerald-500">● Saved</span>}
                        </div>
                      </div>
                    )}

                    {/* Usage meters */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Monthly Usage</span>
                      {[
                        { label: "Shots", used: usage.shot_generations_used, limit: accessTier.shot_generations_limit },
                        { label: "Grids", used: usage.character_grids_used, limit: accessTier.character_grids_limit },
                        { label: "Videos", used: usage.video_promotions_used, limit: accessTier.video_promotions_limit },
                      ].map(({ label, used, limit }) => {
                        const pct = limit === null ? 10 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
                        const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
                              <span>{label}</span>
                              <span>{usageLabel(used, limit)}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Greenhouse mini-monitor */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Greenhouse Monitor</span>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stressColor}`} />
                      </div>
                      <div className="flex items-end gap-0.5 h-10">
                        {[20, 35, 30, stressLevel, 60, 45].map((h, i) => (
                          <div key={i} className={`flex-1 rounded-t-sm border-t transition-all duration-700 ${
                            i === 3 && stressLevel >= 80 ? "bg-red-600/40 border-red-500"
                            : i === 3 && stressLevel >= 50 ? "bg-amber-600/40 border-amber-500"
                            : "bg-slate-600/50 border-slate-500/50"
                          }`} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>TENSION {stressLevel}%</span>
                        <span className={stressLevel >= 80 ? "text-red-500" : stressLevel >= 50 ? "text-amber-500" : "text-emerald-500"}>
                          {stressLevel >= 80 ? "CRITICAL" : stressLevel >= 50 ? "RISING" : "STABLE"}
                        </span>
                      </div>
                    </div>

                    {/* Character pressure bars */}
                    <div className="space-y-2.5">
                      {getDisplayCharacters(selectedOption).map((char, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
                            <span>{char.name.toUpperCase()}</span>
                            <span>PRESSURE: {i === 0 ? "92%" : "27%"}</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/50 transition-all duration-1000" style={{ width: i === 0 ? "92%" : "27%" }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* JSON snapshot */}
                    <div className="flex-1 bg-black/60 rounded-xl border border-white/10 overflow-hidden flex flex-col min-h-[200px]">
                      <div className="bg-white/5 px-3 py-2 flex justify-between border-b border-white/10 items-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Story Snapshot</span>
                        <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                        </span>
                      </div>
                      <div className="p-3 overflow-auto font-mono text-[9px] text-emerald-500/70 leading-snug flex-1">
                        <pre className="whitespace-pre-wrap select-text">
                          {JSON.stringify({
                            option_id: selectedOption?.option_id || 1,
                            title: selectedOption?.title || "",
                            controlling_idea: selectedOption?.meaning?.controlling_idea || selectedOption?.step_3_and_4_meaning_and_props?.controlling_idea || "",
                            props: (selectedOption?.meaning?.props_sheet || selectedOption?.step_3_and_4_meaning_and_props?.props_sheet || []).map(p => p.name),
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Footer */}
        <footer className="h-9 flex items-center px-5 justify-between text-[9px] font-mono tracking-tighter text-gray-500 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-nav)" }}>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ENGINE ONLINE
            </span>
            <span className="hidden sm:inline">McKee Architecture: ACTIVE</span>
            <span className="hidden md:inline">Phases 1–6 Pipeline</span>
          </div>
          <div className="flex gap-3">
            <span>A product of Infinite Studio AI · <a href="https://infinitestudioai.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">infinitestudioai.com</a></span>
          </div>
        </footer>

      </div>

      {/* Auth modal (accessible from within app) */}
      <AuthModal
        open={authModalOpen}
        initialMode="signin"
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={() => { setAuthModalOpen(false); setView("app"); }}
      />
    </div>
  );
}
