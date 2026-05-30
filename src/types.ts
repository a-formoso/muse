/**
 * TypeScript types for Infinite Studio
 */

export interface NarrativeDimension {
  period: string;
  duration: string;
  location: string;
  conflict_level: string;
}

export interface CharacterSheet {
  name: string;
  role: string;
  characterization: string;
  true_character: string;
  conscious_desire: string;
  unconscious_desire: string;
}

export interface Step1And2CosmologyAndActors {
  dimensions: NarrativeDimension;
  creative_limitation: string;
  character_sheets: CharacterSheet[];
}

export interface PropItem {
  name: string;
  description: string;
}

export interface DialecticalDebate {
  positive_idea: string;
  negative_counter_idea: string;
}

export interface Step3And4MeaningAndProps {
  premise: string;
  controlling_idea: string;
  dialectical_debate: DialecticalDebate;
  props_sheet: PropItem[];
}

// LEVEL 2 SCHEMA FOR PLAYBOOK NARRATIVE CORE - LEGO BRICKS
export interface CharacterIdentity {
  name: string;
  archetype: string;
  cast_orbit: string;
  gravity: string;
  foil_relationship: string;
  pov: string;
  scale_class: string;
  height: string;
}

export interface CharacterVisuals {
  core_body: string;
  material_texture: string;
  wardrobe: {
    outer_mask: string;
    inner_vulnerability: string;
    accessories: string;
  };
  negative_prompt: string;
}

export interface CharacterKinetics {
  posture: string;
  weight_distribution: string;
  gait: string;
  gesture_vocabulary: string;
  micro_movements: string;
  reaction_tempo: string;
}

export interface CharacterCinematics {
  framing: string;
  color_palette: string[];
  lighting: string;
}

export interface VoiceIdentity {
  sonic_anchor: string;
  voice_clone_id: string;
}

export interface PerformanceStyling {
  timbre: string;
  tempo: string;
}

export interface VoiceStateTelemetry {
  stability: number;
  similarity_boost: number;
  style_exaggeration: number;
  stress_cues: string;
}

export interface CharacterAudio {
  voice_identity: VoiceIdentity;
  performance_styling: PerformanceStyling;
  state_telemetry: {
    neutral_state: VoiceStateTelemetry;
    tension_state: VoiceStateTelemetry;
    panic_state: VoiceStateTelemetry;
  };
  monologue_script: string;
}

export interface CharacterPsychology {
  social: string;
  personal: string;
  core: string;
  hidden: string;
}

export interface CharacterMetrics {
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  quotients: {
    iq: number;
    eq: number;
    pq: number;
    cq: number;
  };
}

export interface CharacterMotivation {
  drive: string;
  signature_move: string;
  litmus_test: string;
  conscious_desire: string;
  unconscious_need: string;
  empathy_hook: string;
  dilemma_type: string;
  dilemma_desc: string;
  cinematic_proof: string;
}

export interface CharacterArc {
  trajectory: string;
  step_1_preparation: string;
  step_2_revelation: string;
  step_3_change: string;
  step_4_completion: string;
}

export interface MasterVisualReference {
  character_name: string;
  core_keywords_used: string;
  master_grid_prompt: string;
  master_grid_prompt_state2?: string;
  master_grid_prompt_state3?: string;
  master_grid_prompt_state4?: string;
  [key: string]: string | undefined;
}

export interface Character {
  id: string;
  identity: CharacterIdentity;
  visuals: CharacterVisuals;
  kinetics: CharacterKinetics;
  cinematics: CharacterCinematics;
  audio: CharacterAudio;
  psychology: CharacterPsychology;
  metrics: CharacterMetrics;
  motivation: CharacterMotivation;
  arc: CharacterArc;
  prompts: {
    master_visual_reference: MasterVisualReference;
  };
  /** true once the full bible has been generated on demand (vs. a roster stub). */
  _generated?: boolean;
}

/** Lightweight character entry from the Phase-1 spine; full bible fetched on demand. */
export interface CharacterStub {
  id: string;
  name: string;
  archetype: string;
  cast_orbit: string;
  gravity: string;
}

export interface SettingSchema {
  dimensions: NarrativeDimension;
  creative_limitation: string;
}

export interface MeaningSchema {
  premise?: string;
  controlling_idea: string;
  /** The final value charge of the controlling idea: Idealistic | Pessimistic | Ironic. */
  story_charge?: string;
  dialectical_debate: DialecticalDebate;
  props_sheet: PropItem[];
}

/** McKee's Inciting Incident — the event that upsets the protagonist's balance and launches the spine. */
export interface IncitingIncident {
  event: string;
  /** How it arises: "decision" or "coincidence". */
  origin?: string;
  /** The Major Dramatic Question / "Big Hook" it provokes. */
  major_dramatic_question?: string;
}

export interface StoryOption {
  option_id: number;
  title: string;
  /** McKee Inciting Incident for this direction (from the spine). */
  inciting_incident?: IncitingIncident;
  // Old style attributes
  step_1_and_2_cosmology_and_actors?: Step1And2CosmologyAndActors;
  step_3_and_4_meaning_and_props?: Step3And4MeaningAndProps;
  // New style attributes
  setting?: SettingSchema;
  meaning?: MeaningSchema;
  characters?: Character[];
  /** Roster of character stubs from the spine; full bibles loaded into `characters` on demand. */
  character_roster?: CharacterStub[];
  /** Persistence-only: all generated Phase-1 options, embedded on the saved (selected)
   *  option so a reload/resume can re-hydrate the full set. Ignored by downstream phases. */
  _all_options?: StoryOption[];
}

export interface Scene {
  scene_number: number;
  setting_micro: string;
  scene_objective: string;
  opening_value: string;
  closing_value: string;
  narrative_action: string;
  visualDesc: string;
}

export interface Sequence {
  sequence_id: string;
  act: string;
  actLabel: string;
  title: string;
  setting_macro: string;
  themeFocus: string;
  dramatic_arc: string;
  scenes: Scene[];
}

export interface SequenceMap {
  act_one_sequences: Sequence[];
  act_two_sequences: Sequence[];
  act_three_sequences: Sequence[];
}

export interface ShotComposition {
  framing: string;
  lens_profile: string;
  camera_movement: string;
  focal_target: string;
}

export interface ShotPerformance {
  primary_actor_id: string;
  active_kinetic_token: string;
  gaze_vector: string;
}

export interface ShotChroma {
  key_lighting: string;
  environmental_vfx: string;
}

export interface CinematicShot {
  shot_id: string;
  composition: ShotComposition;
  performance_capture: ShotPerformance;
  chroma_and_lighting: ShotChroma;
  automated_image_prompt: string;
}

// ── 60/30/10 Style Preset System ────────────────────────────────────────────

export interface StyleLayer {
  weight: 60 | 30 | 10;
  label: string;
  description: string;
  elements: string[];
}

export interface StylePreset {
  preset_id: string;
  title: string;
  core_identity: StyleLayer;        // 60% — primary visual language, lighting logic, color dominance
  secondary_influence: StyleLayer;  // 30% — genre modifiers, atmosphere, texture, lens behavior
  accent_layer: StyleLayer;         // 10% — highlight colors, visual anomalies, symbolic motifs
}

export interface SubtextualBeat {
  beat_number: number;
  shot_id?: string; // e.g. "A1_Q1_S1_B1" — reference key for Phase 5
  action: string;
  reaction: string;
  text: string;
  vocal_state?: string; // e.g. "neutral_state", "tension_state", "panic_state"
  status: string;
  visual_flora: string;
  cinematic_storyboard?: CinematicShot[];
}

export interface MicroBlueprint {
  scene_objective: string;
  opening_value: string;
  closing_value: string;
  subtextual_beat_progression: SubtextualBeat[];
}

export interface BeatSheet {
  target_sequence_id: string;
  scene_number: number;
  micro_blueprint: MicroBlueprint;
}

export interface Blueprint {
  title: string;
  // Old attributes
  step_1_and_2_cosmology_and_actors?: Step1And2CosmologyAndActors;
  step_3_and_4_meaning_and_props?: Step3And4MeaningAndProps;
  step_5a_sequence_map?: SequenceMap;
  step_5b_subtextual_beat_sheets?: BeatSheet[];
  step_6_master_logline?: string;

  // New attributes
  setting?: SettingSchema;
  meaning?: MeaningSchema;
  characters?: Character[];
  sequences?: {
    act_one_sequences: Sequence[];
    act_two_sequences: Sequence[];
    act_three_sequences: Sequence[];
  };
  beats?: BeatSheet[];
  logline?: string;
}

