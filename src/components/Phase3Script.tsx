import { useState } from "react";
import { Blueprint } from "../types";
import { PRESEEDED_SCRIPT } from "../preseededData";
import { getAuthHeader } from "../lib/authHeader";
import { Sparkles, Copy, Calendar, Download, FileText, Check, HelpCircle, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { getBlueprintSequences } from "../utils/schemaConverter";

const PHASE_1_PROMPT = `You are an elite, award-winning Hollywood screenwriter and script analyst. Your creative process is strictly governed by the narrative architecture of Robert McKee (Story) and Stanislavskian behavioral subtext.

We are starting PHASE 1: THE COSMOLOGY & THE DIGITAL ACTORS of our short film pipeline.

Analyze the following premise:
"What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?"

Generate THREE distinct narrative directions for this setup. For each option, you must output a raw, well-structured JSON block matching this exact structural schema. 

Note that character generation is separated from cosmology to ensure maximum psychological depth. Character profiles must be written as modular, self-contained "Lego Bricks" that combine McKee's internal character dimensions with direct physical, kinetic, and voice API rendering telemetry:

[
  {
    "option_id": 1,
    "title": "Story Title Here",
    "setting": {
      "dimensions": { 
        "period": "E.g., Near-future corporate espionage era", 
        "duration": "E.g., 15 minutes in real-time", 
        "location": "E.g., Rooftop Bio-Dome Penthouse", 
        "conflict_level": "E.g., Extra-personal & Personal Conflict" 
      }, 
      "creative_limitation": "E.g., Confined to a single dining table set inside a hyper-responsive greenhouse"
    }, 
    "meaning": { 
      "premise": "What if...", 
      "controlling_idea": "Value + Cause", 
      "dialectical_debate": { 
        "positive_idea": "The belief validating the protagonist's starting mask", 
        "negative_counter_idea": "The opposing truth forcing vulnerability" 
      }, 
      "props_sheet": [
        { "name": "Prop Name", "description": "How it acts as an interactive narrative catalyst" }
      ] 
    },
    "characters": [
      {
        "id": "char_unique_id (e.g., char_1, char_2)",
        "identity": {
          "name": "Character Name",
          "archetype": "Dramatic archetype function (e.g., The Saboteur, The Fallen Sentinel)",
          "cast_orbit": "Position in the Cast Solar System (Protagonist (Core Star) / First Circle Foil / Second Circle Utility)",
          "gravity": "Core narrative purpose driving the plot",
          "foil_relationship": "Explicit contrast relationship with target character ID",
          "pov": "Reliability/Observer status (e.g., Unreliable Narrator)",
          "scale_class": "Scale classification (Class A [Human] / Class B [Small] / Class C [Massive])",
          "height": "Numerical height (e.g., 180cm or 5cm)"
        },
        "visuals": {
          "core_body": "Strict physical tokens (Age, Gender, Build, Skin Tone, Hair, Eyes, Distinguishing Features)",
          "material_texture": "Strict rendering textures verbatim (e.g., pore texture, subsurface scattering, cinematic lighting)",
          "wardrobe": {
            "outer_mask": "Outfit A: Armor/public clothes representing social persona",
            "inner_vulnerability": "Outfit B: Softer, personal context clothing layers representing true self",
            "accessories": "Fixed, non-changing physical items worn/carried (e.g. silver signet ring)"
          },
          "negative_prompt": "Unwanted elements to exclude during image generation (e.g., plastic skin, low resolution, 3d render)"
        },
        "kinetics": {
          "posture": "Physical stance and natural state of skeletal balance",
          "weight_distribution": "How weight shift dictates physical movement",
          "gait": "Standard walk cycle pattern and cadence",
          "gesture_vocabulary": "Frequent physical tics, hand habits, or defensive gestures",
          "micro_movements": "Subtle eye, jaw, or finger adjustments for high-fidelity CGI",
          "reaction_tempo": "Response latency to external stimuli (e.g., 200ms lag under pressure)"
        },
        "cinematics": {
          "framing": "Optimal camera lens/distance preset for emotional delivery",
          "color_palette": ["primary color name/hex", "secondary color", "panic/climax state color"],
          "lighting": "Lighting key/mood preset"
        },
        "audio": {
          "voice_identity": {
            "sonic_anchor": "Voice blending formula (e.g., Cillian Murphy's cold cadence + George Clooney's warm register)",
            "voice_clone_id": "eleven_labs_voice_preset_or_cloning_seed"
          },
          "performance_styling": {
            "timbre": "Base tonal descriptor (e.g., gravelly, soft rasp, melodic)",
            "tempo": "Standard verbal pacing, presence of pauses"
          },
          "state_telemetry": {
            "neutral_state": {
              "stability": 75,
              "similarity_boost": 75,
              "style_exaggeration": 15,
              "stress_cues": "Even breathing, calm projection, highly structured articulation"
            },
            "tension_state": {
              "stability": 50,
              "similarity_boost": 75,
              "style_exaggeration": 35,
              "stress_cues": "Slight micro-pauses, swallowing hard between sentences, tight projection"
            },
            "panic_state": {
              "stability": 30,
              "similarity_boost": 75,
              "style_exaggeration": 65,
              "stress_cues": "Voice cracking under strain, shallow rapid exhalations, sudden catching in the throat"
            }
          },
          "monologue_script": "A 15-20 second monologue script explaining the character's worldview"
        },
        "psychology": {
          "social": "Public mask used to control/navigate power",
          "personal": "Behavioral texture used during moments of intimacy",
          "core": "Underlying identity center that is fiercely guarded",
          "hidden": "Unconscious traumas, fears, or repressions"
        },
        "metrics": {
          "personality": {
            "openness": 50,
            "conscientiousness": 50,
            "extraversion": 50,
            "agreeableness": 50,
            "neuroticism": 50
          },
          "quotients": {
            "iq": 100,
            "eq": 100,
            "pq": 100,
            "cq": 100
          }
        },
        "motivation": {
          "drive": "One of 12 primal McKee drives (e.g., Survival, Meaning, Power)",
          "signature_move": "The specific, unexpected behavioral pattern used to solve problems under pressure",
          "litmus_test": "[SUBJECT] wants [Goal], BUT faces [Constraint] while battling [Flaw], SO they [Signature Move]",
          "conscious_desire": "The Spine: what the character thinks they want",
          "unconscious_need": "The Absolute Contradiction: what they actually need",
          "empathy_hook": "Core piece of vulnerability that makes the audience care",
          "dilemma_type": "Irreconcilable Goods vs. Lesser of Evils",
          "dilemma_desc": "Climax choice parameter",
          "cinematic_proof": "A 1-paragraph visual scene proving this signature tactic in action"
        },
        "arc": {
          "trajectory": "Arc name (e.g., Redemption, Degeneration)",
          "step_1_preparation": "Initial state of unexpressed potential/void",
          "step_2_revelation": "High-stakes situation where mask is stripped",
          "step_3_change": "Sequence value transitions (e.g., Control [+] to Exposure [---])",
          "step_4_completion": "Final action resolving desire and fulfilling need"
        },
        "prompts": {
          "master_visual_reference": {
            "character_name": "Character Name",
            "core_keywords_used": "CORE_BODY keywords + MATERIAL_TEXTURE keywords",
            "master_grid_prompt": "A master character design reference sheet for [core_body], [material_texture], wearing [outer_mask]. The character is [height] tall. 10-panel 5x2 grid. Top Row: Full-body Front View (0 deg), Full-body 3/4 Front View (45 deg), Full-body Profile View (90 deg), Full-body 3/4 Back View (135 deg), Full-body Back View (180 deg), Solid light grey background next to a vertical measurement bar positioned on the LEFT displaying markings for Class A/B/C metrics in clear black text. Bottom Row: Close-up Headshots showing Neutral Front View (0 deg), Neutral Profile, Joy/Laughter, Anger/Rage, Sadness/Grief. Soft even studio lighting, high-fidelity reference style. --ar 16:9"
          }
        }
      }
    ]
  }
]

Reject all surface-level tropes and empty exposition. Ensure that character Unconscious Desires directly undermine their Conscious Desires.`;

const PHASE_2_PROMPT = `We are proceeding to PHASE 3: THE BLUEPRINT & STRUCTURAL SCENE DESIGN.

I have selected Option [INSERT CHOSEN OPTION ID] / Title: "[INSERT CHOSEN TITLE]".
Here is the locked Phase 1 data:
[PASTE CHOSEN JSON BLOCK FROM PHASE 1 HERE]

Your task is to expand this concept into a tightly proportional, multi-sequence framework spanning all three acts. You are strictly forbidden from leaving "story vacuums" in Act 1 or Act 3. 

Every scene in your sequence map and every beat in your beat sheet must refer directly to the character Lego blocks by their unique ID (e.g., "char_1", "char_2") to ensure perfect structural consistency.

In building the beats, you must actively utilize each character's "kinetics" (gesture vocabulary, micro-movements, reaction tempo) and transition their vocal "state_telemetry" (neutral_state, tension_state, panic_state) alongside McKee's value shifts.

You must output a single, consolidated JSON block matching this exact schema:

{
  "title": "[INSERT CHOSEN TITLE]",
  "setting": [PASTE PREVIOUS DATA HERE],
  "meaning": [PASTE PREVIOUS DATA HERE],
  "characters": [PASTE PREVIOUS DATA HERE],
  "sequences": {
    "act_one_sequences": [ 
      { 
        "sequence_id": "A1_S1", 
        "act": "ACT ONE",
        "actLabel": "Set-Up",
        "title": "Sequence Title", 
        "setting_macro": "The starting location", 
        "themeFocus": "E.g., Control - Isolation - Illusion",
        "dramatic_arc": "Brief description of the value shift in this sequence", 
        "scenes": [ 
          { 
            "scene_number": 1, 
            "setting_micro": "E.g., Boardroom Chair - ECU", 
            "scene_objective": "What the character physically/situationally wants (Reference character ID, e.g. char_1 wants...)", 
            "opening_value": "Starting value charge", 
            "closing_value": "Ending value charge", 
            "narrative_action": "How action collides with the world to open 'The Gap' (Reference the character's litmus_test and signature_move)",
            "visualDesc": "Broad, atmospheric, and stylistic layout of setting_macro"
          } 
        ] 
      } 
    ], 
    "act_two_sequences": [
      { 
        "sequence_id": "A2_S1", 
        "act": "ACT TWO",
        "actLabel": "Confrontation",
        "title": "Sequence Title", 
        "setting_macro": "The new macro setting location", 
        "themeFocus": "E.g., Exposure - Disorientation",
        "dramatic_arc": "Description of the value escalation", 
        "scenes": [ 
          { 
            "scene_number": 2, 
            "setting_micro": "E.g., Vivarium Door - Wide", 
            "scene_objective": "Target scene goal", 
            "opening_value": "", 
            "closing_value": "", 
            "narrative_action": "",
            "visualDesc": ""
          } 
        ] 
      }
    ], 
    "act_three_sequences": [
      { 
        "sequence_id": "A3_S1", 
        "act": "ACT THREE",
        "actLabel": "Resolution",
        "title": "Sequence Title", 
        "setting_macro": "The climax macro setting", 
        "themeFocus": "E.g., Connotation - Transformation",
        "dramatic_arc": "Climax and Resolution transition arc", 
        "scenes": [ 
          { 
            "scene_number": 5, 
            "setting_micro": "E.g., Core Interface - Close", 
            "scene_objective": "", 
            "opening_value": "", 
            "closing_value": "", 
            "narrative_action": "",
            "visualDesc": ""
          } 
        ] 
      }
    ] 
  }, 
  "beats": [ 
    { 
      "target_sequence_id": "A1_S1", 
      "scene_number": 1, 
      "micro_blueprint": { 
        "scene_objective": "Scene target objective", 
        "opening_value": "", 
        "closing_value": "", 
        "subtextual_beat_progression": [ 
          { 
            "beat_number": 1, 
            "action": "[Character ID]: ACTIVE GERUND + KINETIC DETAIL (Action beneath dialogue, e.g. char_1: FEIGNING ACCOUNTABILITY while compulsively turning his signet ring)", 
            "reaction": "[Character ID]: ACTIVE GERUND + KINETIC REACT (Subtextual reaction, e.g. char_2: MANAGING THE TRAP, her eyes tracking his hand movements)",
            "text": "The literal spoken line acting as a mask",
            "vocal_state": "Current active voice state (neutral_state / tension_state / panic_state)",
            "status": "Psychological tension indicator",
            "visual_flora": "Biochemical shift of orchids/environment triggered by stress metrics"
          } 
        ] 
      } 
    }
  ], 
  "logline": "Compile a single, high-velocity sentence stating protagonist, inciting incident, Spine, and central ironic stakes."
}

Generate detailed beat_progressions for ALL scenes across Acts I, II, and III. Make sure every beat features active, capitalized gerund subtext tags, physical kinetic details, and vocal state tags linked to character IDs.`;

const PHASE_3_PROMPT = `We are proceeding to PHASE 5: THE SCRIPT EXECUTION. 

Here is our locked, consolidated Pre-Production JSON Blueprint:
[PASTE COPIED BLUEPRINT JSON FROM PHASE 2 HERE]

Write the final, production-ready screenplay based strictly on this data structure. Adhere to the following structural and stylistic execution laws:

1. FORMAT: Use flawless, standard screenplay layout. Use uppercase for CHARACTER NAMES in dialogue headings and action line introductions. Use parentheticals only to denote active subtextual transitions and physical vocal delivery states, not literal physical actions.
2. DIALOGUE SUBTEXT CONSTRAINT: Every line of spoken text must act as a diplomatic surface mask. Dialogue must naturally deliver the exact step-by-step psychological agendas mapped out in your "beats" behavioral gerund tags. Characters must never speak their inner truths until the script hits the raw, mask-shattering explosion of the Story Climax.
3. KINETIC PHYSICALITY: Weave each character's kinetic profile (posture, gait, gestures, and reaction tempo) directly into the action blocks to visually ground the performance for the camera. 
4. VOCAL STATE PARENTHETICALS: Translate the active "vocal_state" (neutral_state, tension_state, panic_state) from your beats array into precise parentheticals. Use the exact "stress_cues" text (e.g., "voice cracking", "shallow rapid breathing") to define how the dialogue is delivered.
5. FRENCH SCENES: Advance the scene's internal rhythm and tempo every single time a character enters, exits, or radically alters the power dynamics of the room.
6. VARIATION: Alternate rapid, visual action blocks describing environmental and physical changes with expansive, emotionally dense subtextual confrontations.
7. THEMATIC TRANSITIONS: Link consecutive scenes using a clean sensory hinge (a shared object, an opposing quality of light, a sound bridge, or a word contrast) as defined in the playbook.

Include the visual_flora color shifts (e.g., violet, pale yellow, mottled, defensive crimson) in the action blocks to visually represent the characters' sweat and adrenaline changes. Begin the script immediately.`;


interface Phase3ScriptProps {
  blueprint?: Blueprint;
  selectedScriptText?: string;
  onUpdateScriptText: (text: string) => void;
  onProceedToVisuals?: () => void;
}

export function Phase3Script({ blueprint, selectedScriptText, onUpdateScriptText, onProceedToVisuals }: Phase3ScriptProps) {
  const [scriptText, setScriptText] = useState(selectedScriptText || PRESEEDED_SCRIPT);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"screenplay" | "playbook">("screenplay");
  const [highlightBioShifts, setHighlightBioShifts] = useState(true);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [genProgress, setGenProgress] = useState<{ done: number; total: number } | null>(null);

  // Ordered (sequence, scene) list flattened from the blueprint structure.
  const orderedScenes = (() => {
    const seqs = getBlueprintSequences(blueprint);
    const all = [
      ...(seqs.act_one_sequences || []),
      ...(seqs.act_two_sequences || []),
      ...(seqs.act_three_sequences || []),
    ];
    const list: { sequenceId: string; sceneNumber: number }[] = [];
    all.forEach((s: any) => (s.scenes || []).forEach((sc: any) => list.push({ sequenceId: s.sequence_id, sceneNumber: sc.scene_number })));
    return list;
  })();

  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  // Write the screenplay scene-by-scene (sequential, assembled live) so each
  // request stays small enough to clear the rate limit. Falls back to the legacy
  // whole-script endpoint when the blueprint has no structured sequences.
  const handleGenerateScript = async () => {
    setIsLoading(true);
    setErrorInfo(null);

    if (orderedScenes.length === 0) {
      try {
        const resp = await fetch("/api/generate-phase3", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
          body: JSON.stringify({ blueprint }),
        });
        const data = await resp.json();
        if (data.success && data.script) {
          setScriptText(data.script);
          onUpdateScriptText(data.script);
        } else {
          setErrorInfo(data.message || "Could not compile screenplay. Rendered pre-seeded script.");
          setScriptText(PRESEEDED_SCRIPT);
          onUpdateScriptText(PRESEEDED_SCRIPT);
        }
      } catch {
        setErrorInfo("Script endpoint unreachable. Restored pre-seeded script.");
        setScriptText(PRESEEDED_SCRIPT);
        onUpdateScriptText(PRESEEDED_SCRIPT);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const parts: string[] = [];
    let failures = 0;
    for (let i = 0; i < orderedScenes.length; i++) {
      const { sequenceId, sceneNumber } = orderedScenes[i];
      setGenProgress({ done: i, total: orderedScenes.length });
      try {
        const resp = await fetch("/api/phase3-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
          body: JSON.stringify({ blueprint, sequenceId, sceneNumber }),
        });
        const data = await resp.json();
        if (data.success && data.sceneText) {
          parts.push(String(data.sceneText).trim());
        } else {
          failures++;
          parts.push(`[Scene ${sequenceId} · ${sceneNumber} — generation failed, click Generate again to retry]`);
        }
      } catch {
        failures++;
        parts.push(`[Scene ${sequenceId} · ${sceneNumber} — connection error, retry]`);
      }
      const assembled = parts.join("\n\n");
      setScriptText(assembled);
      onUpdateScriptText(assembled);
      if (i < orderedScenes.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }
    if (failures > 0) setErrorInfo(`${failures} scene(s) failed to generate — click Generate Script again to retry them.`);
    setGenProgress(null);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to highlight biochemical stress-shifting words incourier screenplay text
  const formatScriptWithHighlights = (rawText: string) => {
    if (!highlightBioShifts) return rawText;

    // Split text by lines to construct correct format HTML elements
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // Look for botanical and chemical colors
      let renderedLine = line;

      // Simple keywords replacements
      const keywords = ["PALE LAVENDER", "VIOLET", "AMBER FLASHES", "DEFENSIVE CRIMSON", "CRIMSON", "AMBER", "Aconite-9", "metallic", "sap", "bio-metric"];
      
      // Let's check if there is a heading or centering needed
      const isCharacterHeading = /^[A-Z\s]{3,25}$/.test(line.trim()) && !line.includes("INT.") && !line.includes("EXT.");
      const isDialogueLine = line.startsWith("      ") || line.startsWith("    ") && !isCharacterHeading;
      
      let lineClass = "text-slate-300 font-mono text-xs leading-relaxed py-0.5 ";
      if (isCharacterHeading) {
        lineClass = "text-orange-500 font-bold text-xs tracking-wider uppercase text-center py-2 block ";
      } else if (isDialogueLine) {
        lineClass = "text-slate-100 text-xs text-center max-w-sm mx-auto block py-0.5 leading-relaxed ";
      } else if (line.includes("SCENE") || line.includes("INT.") || line.includes("EXT.")) {
        lineClass = "text-slate-100 font-bold border-l-2 border-orange-600 pl-2 py-1 mt-4 block ";
      }

      // Escape HTML characters safely
      const escapedLine = renderedLine
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt; font-mono");

      let highlighted = escapedLine;
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
        highlighted = highlighted.replace(regex, `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/45 border border-orange-500/25 text-orange-400 capitalize hover:scale-105 transition-all">$1</span>`);
      });

      return (
        <span 
          key={idx} 
          className={lineClass} 
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      );
    });
  };

  // Copy paste prompts for the playbook sequence
  const getPlaybookPrompts = () => {
    return `── PHASE 1: THE DISCOVERY & ANATOMY PROMPT ──
Objective: Establish the world boundaries, deep character psychology, dialectical argument, and dynamic props.

You are an elite, award-winning Hollywood screenwriter and script analyst. Your creative process is strictly governed by the narrative architecture of Robert McKee (Story) and Stanislavskian behavioral subtext. 

We are starting PHASE 1: THE COSMOLOGY & THE DIGITAL ACTORS of our short film pipeline.

Analyze the following premise:
"What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?"

Generate THREE distinct narrative directions for this setup. For each option, you must output a raw, well-structured JSON block matching this exact structural schema:
... [See detailed schema inside interactive script tools] ...

── PHASE 2: THE PRE-PRODUCTION BLUEPRINT PROMPT ──
Objective: Deconstruct the chosen option into a multi-sequence act map and generate micro-subtextual beat sheets for the actors.

We are proceeding to PHASE 3: THE BLUEPRINT & STRUCTURAL SCENE DESIGN.
...

── PHASE 3: THE SCRIPT EXECUTION PROMPT ──
Objective: Translate the complete, locked JSON blueprint into a professional, production-ready screenplay with deep subtext.
...`;
  };

  return (
    <div className="space-y-8">
      {/* Script Header Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">
            Phase 3 Script Output
          </span>
          <h2 className="text-xl md:text-2xl font-sans font-medium text-slate-100 mt-1">
            Standard Hollywood Screenplay
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1 block">
            Core Target: <strong className="text-slate-200">"The Orchid Recessional" Screenplay draft 1</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === "screenplay" ? "playbook" : "screenplay")}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-mono transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-orange-500" />
            {activeTab === "screenplay" ? "Prompt Guide" : "Screenplay Draft"}
          </button>

          <button
            onClick={handleGenerateScript}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs text-white font-mono font-bold transition-all shadow-lg shadow-orange-950/30 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading
              ? (genProgress ? `Writing scene ${genProgress.done + 1}/${genProgress.total}…` : "Assembling…")
              : "Generate Script"}
          </button>

          {onProceedToVisuals && (
            <button
              onClick={onProceedToVisuals}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-xs text-white font-mono font-bold transition-all shadow-lg shadow-blue-950/30 cursor-pointer"
            >
              Begin Visual Production →
            </button>
          )}
        </div>
      </div>

      {errorInfo && (
        <div className="p-3 rounded-lg border border-yellow-900/30 bg-yellow-950/25 text-yellow-500 text-xs font-mono">
          <strong>Backend Notice:</strong> {errorInfo}
        </div>
      )}

      {/* Screenplay layout tabs */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col min-h-[500px]">
        {/* Controls bar above text block */}
        <div className="bg-black/40 border-b border-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">
              {activeTab === "screenplay" ? "Screenplay Studio Courier Engine" : "Infinite Studio Prompt Library"}
            </span>
            {activeTab === "screenplay" && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-500 selection:bg-transparent">
                <input
                  type="checkbox"
                  checked={highlightBioShifts}
                  onChange={() => setHighlightBioShifts(!highlightBioShifts)}
                  className="rounded bg-black border-white/10 text-orange-550 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                Show active stress shifts
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black hover:bg-white/5 border border-white/10 text-xs text-slate-300 font-mono transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-orange-500" /> Copy Text
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 p-6 sm:p-8 bg-black/40 text-left font-mono text-sm max-w-4xl mx-auto w-full border-x border-white/10 select-text selection:bg-orange-900/35 selection:text-white">
          {activeTab === "screenplay" ? (
            <div className="space-y-1 font-mono leading-relaxed select-text font-normal tracking-wide pl-2 sm:pl-8 py-2 text-slate-200">
              {formatScriptWithHighlights(scriptText)}
            </div>
          ) : (
            <div className="space-y-8 text-xs text-slate-300 font-mono leading-relaxed select-text py-2">
              <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Infinite Studio: Playbook Execution Guide</span>
                </div>
                <p className="font-sans text-slate-300 leading-normal text-xs">
                  This guide details the exact 3-phase prompt sequence to operationalize your screenwriting playbook with advanced LLMs. Follow this pipeline step-by-step to generate airtight, structurally sound narrative blueprints that integrate directly into your mockup app.
                </p>
              </div>

              {/* PHASE 1 PROMPT CONTAINER */}
              <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">
                      Phase 1 Prompt
                    </span>
                    <h4 className="font-sans text-sm font-semibold text-slate-200 mt-0.5">
                      THE DISCOVERY & ANATOMY PROMPT
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(PHASE_1_PROMPT, 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/60 hover:bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono transition-all cursor-pointer"
                  >
                    {copiedPromptIndex === 1 ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-orange-500" /> Copy Phase 1 Prompt
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-black/60 overflow-x-auto text-[11px]">
                  <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed select-all">{PHASE_1_PROMPT}</pre>
                </div>
              </div>

              {/* PHASE 2 PROMPT CONTAINER */}
              <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">
                      Phase 2 Prompt
                    </span>
                    <h4 className="font-sans text-sm font-semibold text-slate-200 mt-0.5">
                      THE PRE-PRODUCTION BLUEPRINT PROMPT
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(PHASE_2_PROMPT, 2)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/60 hover:bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono transition-all cursor-pointer"
                  >
                    {copiedPromptIndex === 2 ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-orange-500" /> Copy Phase 2 Prompt
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-black/60 overflow-x-auto text-[11px]">
                  <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed select-all">{PHASE_2_PROMPT}</pre>
                </div>
              </div>

              {/* PHASE 3 PROMPT CONTAINER */}
              <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] tracking-widest text-orange-500 uppercase font-bold">
                      Phase 3 Prompt
                    </span>
                    <h4 className="font-sans text-sm font-semibold text-slate-200 mt-0.5">
                      THE SCRIPT EXECUTION PROMPT
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(PHASE_3_PROMPT, 3)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/60 hover:bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono transition-all cursor-pointer"
                  >
                    {copiedPromptIndex === 3 ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-orange-500" /> Copy Phase 3 Prompt
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-black/60 overflow-x-auto text-[11px]">
                  <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed select-all">{PHASE_3_PROMPT}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
