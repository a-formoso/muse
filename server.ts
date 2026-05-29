import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createServer as createViteServer } from "vite";
import { verifyToken, resolveAccessTier, checkAndIncrementUsage, type TierName } from "./server/supabaseAdmin";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to sanitize JSON response from the model (strip any markdown fences)
function cleanJSONString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// Story generation runs on Anthropic's Claude. Premium subscription tiers
// (director, studio) generate on Opus 4.8; lower/free tiers on Sonnet 4.6.
const OPUS_MODEL = "claude-opus-4-8";
const SONNET_MODEL = "claude-sonnet-4-6";
const CLAUDE_MODEL = OPUS_MODEL; // default + status headline

function modelForTier(tier: TierName): string {
  return tier === "director" || tier === "studio" ? OPUS_MODEL : SONNET_MODEL;
}

// Resolve the Claude model for a request from the caller's subscription tier.
// Unauthenticated or unresolvable callers fall back to Sonnet (the lower tier).
async function modelForRequest(req: express.Request): Promise<string> {
  try {
    const userId = await verifyToken(req.headers.authorization);
    if (!userId) return SONNET_MODEL;
    const access = await resolveAccessTier(userId);
    return modelForTier(access.tier);
  } catch {
    return SONNET_MODEL;
  }
}

// Lazy initialization of the Anthropic client to prevent crashing if the key is missing on startup
let aiClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!aiClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set. Using high-fidelity pre-compiled story simulation.");
    }
    aiClient = new Anthropic({ apiKey });
  }
  return aiClient;
}

/**
 * Generate a completion from Claude with adaptive thinking. Streams the response
 * (so large outputs like the Phase 2 blueprint don't hit HTTP timeouts) and returns
 * the concatenated text content. The system prompt is sent as a cacheable block —
 * prompt caching activates automatically once the prefix exceeds the model's minimum
 * cacheable size, so repeated calls with the same system prompt are cheaper.
 */
async function generateWithClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const client = getAnthropicClient();
  const stream = client.messages.stream({
    model: params.model ?? CLAUDE_MODEL,
    max_tokens: params.maxTokens ?? 32000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: params.system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: params.prompt }],
  });
  const message = await stream.finalMessage();
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// ── /api/status — lightweight health check for both AI services ──
app.get("/api/status", async (req, res) => {
  const status = { claude: false, claudeModel: "", higgsfield: false };

  // Check Claude — report availability from key presence rather than burning
  // tokens on a live ping. (The generation endpoints surface real errors per-request.)
  if (process.env.ANTHROPIC_API_KEY) {
    status.claude = true;
    status.claudeModel = CLAUDE_MODEL;
  }

  // Check Higgsfield — lightweight auth ping
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_SECRET;
  if (apiKey && secret) {
    try {
      const r = await fetch("https://api.higgsfield.ai/v1/jobs?limit=1", {
        headers: { Authorization: `Bearer ${apiKey}`, "X-Secret": secret },
      });
      status.higgsfield = r.ok || r.status === 200 || r.status === 404;
    } catch (_) {
      status.higgsfield = false;
    }
  }

  res.json(status);
});

// Config endpoint — exposes public Supabase credentials to the browser
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

// API endpoint to check if the Claude (Anthropic) key is available
app.get("/api/gemini-check", (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "MY_ANTHROPIC_API_KEY";
  res.json({ hasKey });
});

// Phase 1: Generate customized story options
app.post("/api/generate-phase1", async (req, res) => {
  const { customizedPremise } = req.body;
  const targetPremise = customizedPremise || "What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?";

  try {
    const prompt = `You are an elite, award-winning Hollywood screenwriter and script analyst. Your creative process is strictly governed by the narrative architecture of Robert McKee (Story) and Stanislavskian behavioral subtext.

We are starting PHASE 1: THE COSMOLOGY & THE DIGITAL ACTORS of our short film pipeline.

Analyze the following premise:
"${targetPremise}"

Generate THREE distinct narrative directions for this setup. For each option, output a raw, well-structured JSON array matching this exact structural schema:

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
      "controlling_idea": "Value + Cause (how the climax resolves)",
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
        "id": "char_1",
        "identity": {
          "name": "Character Name",
          "archetype": "E.g., The Saboteur, The Fallen Sentinel",
          "cast_orbit": "Protagonist (Core Star)",
          "gravity": "Core narrative goal/purpose",
          "foil_relationship": "Contrast with other character (e.g., char_2)",
          "pov": "Reliable or Unreliable Observer status",
          "scale_class": "Class A [Human] / Class B [Small] / Class C [Massive]",
          "height": "E.g., 180cm"
        },
        "visuals": {
          "core_body": "Physical description (Age, build, skin tone, features)",
          "material_texture": "CGI rendering texture keywords (pores, specularity, subsurface scattering)",
          "wardrobe": {
            "outer_mask": "Formal attire reflecting public social persona",
            "inner_vulnerability": "Softer interior apparel details",
            "accessories": "Key permanent items (e.g. smart rings, tremor devices)"
          },
          "negative_prompt": "Unwanted items to exclude during image rendering"
        },
        "kinetics": {
          "posture": "Physical stance and skeletal arrangement",
          "weight_distribution": "Body weight allocation during movements",
          "gait": "Standard walk cycle cadence",
          "gesture_vocabulary": "Subtle tics, hand adjustments, or nervous habits",
          "micro_movements": "CGI facial/eye adjustments",
          "reaction_tempo": "Response latency (e.g., 200ms lag under pressure)"
        },
        "cinematics": {
          "framing": "Optimal framing (e.g., ECU or Medium Close-Up)",
          "color_palette": ["primary hex", "secondary hex", "climax alert color"],
          "lighting": "Cinematography key lights"
        },
        "audio": {
          "voice_identity": {
            "sonic_anchor": "Voice blending (e.g., Cillian Murphy's cold cadence + George Clooney's warm register)",
            "voice_clone_id": "eleven_labs_voice_preset_or_cloning_seed"
          },
          "performance_styling": {
            "timbre": "Tonal modifiers (gravelly, melodic, soft rasp)",
            "tempo": "Verbal pacing and presence of dramatic pauses"
          },
          "state_telemetry": {
            "neutral_state": {
              "stability": 75,
              "similarity_boost": 75,
              "style_exaggeration": 15,
              "stress_cues": "Even breathing, structured articulation"
            },
            "tension_state": {
              "stability": 50,
              "similarity_boost": 75,
              "style_exaggeration": 35,
              "stress_cues": "Slight micro-pauses, swallowing hard between sentences"
            },
            "panic_state": {
              "stability": 30,
              "similarity_boost": 75,
              "style_exaggeration": 65,
              "stress_cues": "Voice cracking under strain, shallow rapid exhalations"
            }
          },
          "monologue_script": "A 15-20 second monologue script explaining the character's worldview"
        },
        "psychology": {
          "social": "Public mask",
          "personal": "True personality traits",
          "core": "Underlying motivation center",
          "hidden": "Hidden trauma or repression"
        },
        "metrics": {
          "personality": { "openness": 70, "conscientiousness": 80, "extraversion": 40, "agreeableness": 50, "neuroticism": 60 },
          "quotients": { "iq": 120, "eq": 100, "pq": 90, "cq": 110 }
        },
        "motivation": {
          "drive": "Primal drive state",
          "signature_move": "Unique cognitive adjustment tactic",
          "litmus_test": "Action synthesis formula",
          "conscious_desire": "The Spine",
          "unconscious_need": "The contradiction",
          "empathy_hook": "Core piece of vulnerability",
          "dilemma_type": "Irreconcilable Goods / Lesser of Evils",
          "dilemma_desc": "Main climax dilemma description",
          "cinematic_proof": "Brief physical scene depicting signature tactic"
        },
        "arc": {
          "trajectory": "The trajectory path",
          "step_1_preparation": "Initial unexpressed void",
          "step_2_revelation": "Mask stripped detail",
          "step_3_change": "Transition events",
          "step_4_completion": "Fulfillment action"
        },
        "prompts": {
          "master_visual_reference": {
            "character_name": "Character Name",
            "core_keywords_used": "Body + Material keywords",
            "master_grid_prompt": "Ultra-detailed reference grid prompt for the character's BASE STATE — a single wide 16:9 image rendered as a 5×2 reference sheet (10-panel grid). Top row: 5 full-body angles. Bottom row: 5 headshot expressions. Solid light-grey studio background, photorealistic, film production quality.",
            "master_grid_prompt_state2": "Same 5×2 reference sheet prompt for the character's arc.step_3_change state (injury, wardrobe change, post-revelation appearance). Maintain identical identity, adjust only the changed physical/wardrobe details described in step_3_change."
          }
        }
      }
    ]
  }
]

Reject all surface-level tropes and empty exposition. Output ONLY the raw JSON. Do not include markdown wraps or prefixing.`;

    const model = await modelForRequest(req);
    const text = await generateWithClaude({
      model,
      system: "You are an elite, award-winning Hollywood screenwriter and script analyst. Your creative process is strictly governed by the narrative architecture of Robert McKee (Story) and Stanislavskian behavioral subtext. Output ONLY raw JSON — no markdown, no code fences, no explanation.",
      prompt,
      maxTokens: 32000,
    });

    if (!text) {
      throw new Error("Empty response from Claude.");
    }

    const parsed = JSON.parse(cleanJSONString(text));
    res.json({ success: true, options: parsed });
  } catch (error: any) {
    console.error("Claude Phase 1 generation failed:", error.message);
    res.status(200).json({
      success: false,
      error: error.message,
      message: "Could not talk to AI backend or API key is missing. Loading pre-seeded options.",
    });
  }
});

// Phase 2: Generate Blueprint from Selected Option
app.post("/api/generate-phase2", async (req, res) => {
  const { chosenOption } = req.body;

  if (!chosenOption) {
    return res.status(400).json({ error: "Missing chosenOption payload." });
  }

  try {
    const prompt = `We are proceeding to PHASE 2: THE PRE-PRODUCTION BLUEPRINT & STRUCTURAL SCENE DESIGN.
Expand this chosen story direction into a tightly proportional, multi-sequence framework spanning Act One, Act Two, and Act Three.
You are strictly forbidden from leaving "story vacuums" in Act 1 or Act 3. Use the generated Lego characters array to structure the sequences and make actor subtext beat sheets hyper-specific.

Here is the locked Phase 1 data:
${JSON.stringify(chosenOption, null, 2)}

Your task is to expand this concept into a structural scene map with interactive beats.
Output a single, consolidated JSON block matching this exact structural schema:

{
  "title": "${chosenOption.title}",
  "setting": ${JSON.stringify(chosenOption.setting || {})},
  "meaning": ${JSON.stringify(chosenOption.meaning || {})},
  "characters": ${JSON.stringify(chosenOption.characters || [])},
  "sequences": {
    "act_one_sequences": [ 
      { 
        "sequence_id": "A1_S1", 
        "act": "ACT ONE",
        "actLabel": "Set-Up",
        "title": "Sequence Title Here", 
        "setting_macro": "Location here", 
        "themeFocus": "E.g., Control - Isolation - Illusion",
        "dramatic_arc": "Description of the value shift", 
        "scenes": [ 
          { 
            "scene_number": 1, 
            "setting_micro": "E.g., Boardroom Chair - ECU", 
            "scene_objective": "What character_1 physically wants (Reference character ID like char_1 wants...)", 
            "opening_value": "Starting value", 
            "closing_value": "Ending value", 
            "narrative_action": "Action colliding to open the gap (reference character's signature move)",
            "visualDesc": "Detailed stylistic layout of setting_macro"
          } 
        ]
      } 
    ], 
    "act_two_sequences": [ /* sequences with scenes matching Act 2 mapping */ ], 
    "act_three_sequences": [ /* sequences with scenes matching Act 3 Climax mapping */ ] 
  }, 
  "beats": [ 
    { 
      "target_sequence_id": "A1_S1", 
      "scene_number": 1, 
      "micro_blueprint": { 
        "scene_objective": "Scene objective", 
        "opening_value": "Opening value status", 
        "closing_value": "Closing value status", 
        "subtextual_beat_progression": [ 
          { 
            "beat_number": 1, 
            "shot_id": "A1_Q1_S1_B1",
            "action": "E.g. char_1: FEIGNING ACCOUNTABILITY while compulsively turning his signet ring", 
            "reaction": "E.g. char_2: MANAGING THE TRAP, her eyes tracking his hand movements",
            "text": "The literal spoken mask line here",
            "vocal_state": "The precise active vocal state (neutral_state / tension_state / panic_state)",
            "status": "Psychological tension, heartrate, somatic tremors",
            "visual_flora": "Greenhouse flora colors reacting to stress metrics"
          } 
        ] 
      } 
    }
  ], 
  "logline": "Compile a single, high-velocity McKee master logline stating protagonist, incident, spine, and central ironic stakes."
}

Generate detailed beat_progressions (minimum 3 beats per scene) for ALL scenes across Acts I, II, and III. Make sure every beat features active, capitalized gerund subtext tags and references vocal_state values. Ensure output is strictly Valid JSON.`;

    const model = await modelForRequest(req);
    const text = await generateWithClaude({
      model,
      system: "You are a master script designer. Return the pre-production blueprint exactly matching the structural JSON schema provided including vocal state mappings. Output ONLY raw JSON — no markdown, no code fences, no explanation.",
      prompt,
      maxTokens: 64000,
    });

    if (!text) {
      throw new Error("No response.");
    }

    const parsed = JSON.parse(cleanJSONString(text));
    res.json({ success: true, blueprint: parsed });
  } catch (error: any) {
    console.error("Claude Phase 2 generation failed:", error.message);
    res.status(200).json({
      success: false,
      error: error.message,
      message: "AI Blueprint layout skipped, loaded seed data.",
    });
  }
});

// Phase 3: Generate Screenplay Text
app.post("/api/generate-phase3", async (req, res) => {
  const { blueprint } = req.body;

  if (!blueprint) {
    return res.status(400).json({ error: "Missing blueprint data." });
  }

  try {
    const prompt = `PHASE 3: THE SCRIPT EXECUTION

Here is the locked, consolidated Pre-Production JSON Blueprint featuring Unified Audio Telemetry specifications:
${JSON.stringify(blueprint, null, 2)}

Translate this blueprint into a professional, production-ready screenplay. Begin the script immediately on the first line. No JSON wrapper. Plain text only.`;

    const systemInstruction = `You are an elite Hollywood screenwriter executing PHASE 3: THE SCRIPT EXECUTION. Translate the blueprint into a production-ready screenplay following these eight laws without exception:

1. FORMAT: Standard screenplay layout. CHARACTER NAMES in uppercase at dialogue headings and all action line introductions. Parentheticals denote active vocal stress states only — never literal physical actions.

2. VOCAL STATE PARENTHETICALS: Translate each beat's vocal_state directly into a parenthetical using the exact stress_cues text from that character's state_telemetry entry. Example: if vocal_state is tension_state and stress_cues reads "Slight micro-pauses, swallowing hard between sentences", the parenthetical must be (slight micro-pauses, swallowing hard between sentences).

3. DIALOGUE SUBTEXT CONSTRAINT: Every spoken line acts as a diplomatic surface mask. Dialogue must naturally deliver the psychological agendas mapped in the subtextual_beat_progression gerund tags. Characters never speak inner truths until the Story Climax mask-shattering moment.

4. KINETIC PHYSICALITY: Weave each character's kinetic profile (posture, weight_distribution, gait, gesture_vocabulary, reaction_tempo, micro_movements) directly into action blocks. Replace all dry exposition with physical somatic gestures.

5. FRENCH SCENES: Advance the internal rhythm every time a character enters, exits, or radically alters the power dynamic. Each French scene shift must register in the action block.

6. VARIATION: Alternate rapid visual action blocks (environmental, physical, flora shifts) with expansive emotionally dense subtextual confrontations. Never run more than three consecutive action lines or three consecutive exchanges without a shift in register.

7. THEMATIC TRANSITIONS: Link every consecutive scene using a sensory hinge — a shared object, opposing light quality, sound bridge, or word contrast carried from the closing line of one scene into the opening line or image of the next.

8. VISUAL FLORA: Include visual_flora color shifts (e.g., violet, pale lavender, defensive crimson, mottled amber) in all action blocks to represent characters' biochemical stress states as described in the beat data.

Output plain text screenplay only. Begin immediately on line 1.`;

    const model = await modelForRequest(req);
    const script = await generateWithClaude({
      model,
      system: systemInstruction,
      prompt,
      maxTokens: 32000,
    });

    res.json({ success: true, script });
  } catch (error: any) {
    console.error("Claude Phase 3 generation failed:", error.message);
    res.status(200).json({
      success: false,
      error: error.message,
      message: "Selected seed screenplays rendered.",
    });
  }
});

// Phase 4: Generate visual asset via Higgsfield
app.post("/api/generate-visual", async (req, res) => {
  // Auth + usage check
  const userId = await verifyToken(req.headers.authorization);
  if (userId) {
    const tier = await resolveAccessTier(userId);
    const check = await checkAndIncrementUsage(userId, "character_grids_used", tier);
    if (!check.allowed) {
      return res.status(403).json({ success: false, limitReached: true, message: `Character grid limit reached (${check.limit}/month).` });
    }
  }

  const { assetId, prompt, negativePrompt } = req.body;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_SECRET;

  if (!apiKey || !secret) {
    return res.status(200).json({
      success: false,
      needsApiKey: true,
      message: "HIGGSFIELD_API_KEY and HIGGSFIELD_SECRET are required (set them as environment variables / secrets)."
    });
  }

  const higgsfieldBody: Record<string, any> = {
    prompt,
    model: "soul",
    num_images: 1,
    aspect_ratio: "16:9",
  };
  if (negativePrompt) higgsfieldBody.negative_prompt = negativePrompt;

  try {
    const response = await fetch("https://api.higgsfield.ai/v1/image/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Secret": secret,
      },
      body: JSON.stringify(higgsfieldBody),
    });
    const ct = response.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const raw = await response.text();
      console.error("Higgsfield visual: unexpected non-JSON response", raw.slice(0, 200));
      return res.json({ success: false, message: `Higgsfield returned HTTP ${response.status}` });
    }
    const data = await response.json() as any;
    if (data.job_id || data.images) {
      res.json({ success: true, jobId: data.job_id, imageUrl: data.images?.[0]?.url });
    } else {
      res.json({ success: false, message: data.error || data.message || "Higgsfield returned no data." });
    }
  } catch (error: any) {
    console.error("Higgsfield visual generation failed:", error.message);
    res.json({ success: false, message: error.message });
  }
});

// Phase 5: Generate shot image or video via Higgsfield Seedance 2.0
app.post("/api/generate-shot", async (req, res) => {
  // Auth + usage check
  const userId = await verifyToken(req.headers.authorization);
  if (userId) {
    const tier = await resolveAccessTier(userId);
    const field = (req.body.type === "video") ? "video_promotions_used" : "shot_generations_used";
    const check = await checkAndIncrementUsage(userId, field, tier);
    if (!check.allowed) {
      return res.status(403).json({ success: false, limitReached: true, message: `Limit reached (${check.limit}/month).` });
    }
  }

  const { shotId, prompt, type, imageUrl } = req.body;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_SECRET;

  if (!apiKey || !secret) {
    return res.status(200).json({
      success: false,
      needsApiKey: true,
      message: "HIGGSFIELD_API_KEY and HIGGSFIELD_SECRET are required (set them as environment variables / secrets)."
    });
  }

  try {
    if (type === "image") {
      const response = await fetch("https://api.higgsfield.ai/v1/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Secret": secret,
        },
        body: JSON.stringify({ prompt, model: "soul", num_images: 1, aspect_ratio: "16:9" }),
      });
      const ct = response.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const raw = await response.text();
        console.error("Higgsfield shot/image: non-JSON", raw.slice(0, 200));
        return res.json({ success: false, message: `Higgsfield returned HTTP ${response.status}` });
      }
      const data = await response.json() as any;
      res.json({ success: true, jobId: data.job_id, imageUrl: data.images?.[0]?.url });
    } else {
      // Video via Seedance 2.0
      const response = await fetch("https://api.higgsfield.ai/v1/videos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Secret": secret,
        },
        body: JSON.stringify({ prompt, model: "seedance-2.0", image_url: imageUrl, duration: 5 }),
      });
      const ct = response.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const raw = await response.text();
        console.error("Higgsfield shot/video: non-JSON", raw.slice(0, 200));
        return res.json({ success: false, message: `Higgsfield returned HTTP ${response.status}` });
      }
      const data = await response.json() as any;
      res.json({ success: true, jobId: data.job_id, videoUrl: data.video_url });
    }
  } catch (error: any) {
    console.error("Higgsfield shot generation failed:", error.message);
    res.json({ success: false, message: error.message });
  }
});

// Job status polling
app.get("/api/job-status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_SECRET;

  if (!apiKey || !secret) {
    return res.status(200).json({ success: false, needsApiKey: true });
  }

  try {
    const response = await fetch(`https://api.higgsfield.ai/v1/jobs/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "X-Secret": secret },
    });
    const ct = response.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const raw = await response.text();
      console.error("Higgsfield job-status: non-JSON", raw.slice(0, 200));
      return res.json({ success: false, message: `Higgsfield returned HTTP ${response.status}` });
    }
    const data = await response.json() as any;
    res.json({ success: true, status: data.status, result: data.result });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

// ── /api/elevenlabs/synthesize — generate character voice audio ──
app.post("/api/elevenlabs/synthesize", async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ success: false, needsApiKey: true, message: "ELEVENLABS_API_KEY not set in Secrets." });
  }

  const { voiceId, text, stability, similarityBoost, styleExaggeration } = req.body;
  if (!voiceId || !text) {
    return res.status(400).json({ success: false, message: "voiceId and text are required." });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: (stability ?? 75) / 100,
          similarity_boost: (similarityBoost ?? 75) / 100,
          style: (styleExaggeration ?? 15) / 100,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs error:", errText.slice(0, 300));
      return res.status(200).json({ success: false, message: `ElevenLabs returned ${response.status}: ${errText.slice(0, 200)}` });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    res.json({ success: true, audioBase64: base64Audio, mimeType: "audio/mpeg" });
  } catch (error: any) {
    console.error("ElevenLabs synthesis failed:", error.message);
    res.status(200).json({ success: false, message: error.message });
  }
});

// ── /api/virality-score — Claude-powered virality analysis ──
app.post("/api/virality-score", async (req, res) => {
  const { blueprint, clipOrder } = req.body;
  if (!blueprint) {
    return res.status(400).json({ success: false, message: "blueprint is required." });
  }

  try {
    const title = blueprint.title || "Untitled";
    const logline = blueprint.logline || blueprint.step_6_master_logline || "";
    const clipsDesc = (clipOrder || []).slice(0, 6).map((c: any) =>
      `- Shot ${c.shotId}: "${c.beatText}" | Flora: ${c.flora} | Vocal: ${c.vocal}`
    ).join("\n");

    const prompt = `You are a film virality analyst. Score this short film assembly for social media engagement potential.

TITLE: ${title}
LOGLINE: ${logline}
CLIP SEQUENCE (first 6 shots):
${clipsDesc || "No clips provided."}

Return a JSON object with this exact shape:
{
  "emotional_impact": <0-100 integer>,
  "visual_novelty": <0-100 integer>,
  "pacing_score": <0-100 integer>,
  "overall": <0-100 integer — weighted average>,
  "recommendation": "<one concise actionable sentence>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>"]
}

Base scores on: narrative tension, pacing variety, visual uniqueness of flora/environment descriptors, vocal state escalation arc, and subtext density. Output ONLY raw JSON.`;

    const model = await modelForRequest(req);
    const text = await generateWithClaude({
      model,
      system: "You are a film virality analyst. Output ONLY raw JSON — no markdown, no code fences, no explanation.",
      prompt,
      maxTokens: 4000,
    });

    if (!text) throw new Error("Empty response.");
    const parsed = JSON.parse(cleanJSONString(text));
    res.json({ success: true, scores: parsed });
  } catch (error: any) {
    console.error("Virality scoring failed:", error.message);
    res.status(200).json({ success: false, message: error.message });
  }
});

// Serve frontend assets
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
