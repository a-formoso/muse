import {
  StoryOption,
  Blueprint,
  SettingSchema,
  MeaningSchema,
  Character,
  CharacterStub,
  SequenceMap,
  BeatSheet
} from "../types";

export function getStorySetting(opt: StoryOption): SettingSchema {
  if (opt.setting) {
    return opt.setting;
  }
  return {
    dimensions: opt.step_1_and_2_cosmology_and_actors?.dimensions || {
      period: "Near-future",
      duration: "10 minutes",
      location: "Chamber",
      conflict_level: "High"
    },
    creative_limitation: opt.step_1_and_2_cosmology_and_actors?.creative_limitation || "None"
  };
}

export function getStoryMeaning(opt: StoryOption): MeaningSchema {
  if (opt.meaning) {
    return opt.meaning;
  }
  return {
    controlling_idea: opt.step_3_and_4_meaning_and_props?.controlling_idea || "Theme",
    dialectical_debate: opt.step_3_and_4_meaning_and_props?.dialectical_debate || {
      positive_idea: "Duty",
      negative_counter_idea: "Freedom"
    },
    props_sheet: opt.step_3_and_4_meaning_and_props?.props_sheet || []
  };
}

/** Character roster (stubs) for the option carousel — uses the spine roster if present,
 *  otherwise derives stubs from any already-generated full characters. */
export function getCharacterRoster(opt: StoryOption): CharacterStub[] {
  if (opt.character_roster?.length) return opt.character_roster;
  return getStoryCharacters(opt).map((c) => ({
    id: c.id,
    name: c.identity.name,
    archetype: c.identity.archetype,
    cast_orbit: c.identity.cast_orbit,
    gravity: c.identity.gravity,
  }));
}

export function getStoryCharacters(opt: StoryOption): Character[] {
  if (opt.characters && Array.isArray(opt.characters)) {
    return opt.characters;
  }
  // Convert old sheets
  const sheets = opt.step_1_and_2_cosmology_and_actors?.character_sheets || [];
  return sheets.map((char, index) => {
    const id = `char_${index + 1}`;
    // Seed stability and voice items dynamically
    const names = ["Cillian Murphy's cold cadence + George Clooney's warm register", "Scarlett Johansson's soft warmth + Emily Blunt's strict phrasing"];
    const anchors = names[index] || "Voice blend";
    
    return {
      id,
      identity: {
        name: char.name,
        archetype: char.role || (index === 0 ? "The Saboteur" : "The Partner"),
        cast_orbit: index === 0 ? "Protagonist (Core Star)" : "First Circle Foil",
        gravity: char.conscious_desire || "Survival",
        foil_relationship: `Direct dialectic tension with ${index === 0 ? "char_2" : "char_1"}`,
        pov: "Reliable Observer",
        scale_class: "Class A [Human]",
        height: index === 0 ? "182cm" : "168cm"
      },
      visuals: {
        core_body: char.characterization || "Adult human profile",
        material_texture: "high-contrast cinematic portrait photography, detailed pores, natural skin texture under key rim lighting",
        wardrobe: {
          outer_mask: "Impeccably tailored clean suit representing the corporate front",
          inner_vulnerability: "Open collar, relaxed fabrics representing internal crisis",
          accessories: index === 0 ? "Subtle gold finger ring with micro-sensors" : "Bio-metric smart ring with steel-matted texture"
        },
        negative_prompt: "low resolution, plastic skin, CGI render, cartoon, digital vector painting"
      },
      kinetics: {
        posture: index === 0 ? "Asymmetrical balance, high somatic tension, shoulders locked" : "Rigid spine, chin elevated, calculated geometry",
        weight_distribution: "Tightly centered, leaning away from conversation pivots",
        gait: "Measured, deliberate heel-to-toe pacing",
        gesture_vocabulary: "Subtle finger tapping, adjusting glasses, crossing arms",
        micro_movements: "Blinking latency under stress, jaw clenching, direct eye-lock",
        reaction_tempo: "250ms latency under interrogation"
      },
      cinematics: {
        framing: "ECU (Extreme Close-Up) on eye reflections or high-contrast side profile",
        color_palette: index === 0 ? ["#000000", "#ea580c", "#7c2d12"] : ["#ffffff", "#10b981", "#064e3b"],
        lighting: "Chiaroscuro key, heavy negative slope shadow, sharp rim highlight"
      },
      audio: {
        voice_identity: {
          sonic_anchor: anchors,
          voice_clone_id: index === 0 ? "julian_vance_clone_eleven" : "elena_rostova_clone_eleven"
        },
        performance_styling: {
          timbre: index === 0 ? "Gravelly, soft low rasp, quiet timber authority" : "Cool, soft-spoken stillness, precise sibilants",
          tempo: index === 0 ? "Slow pacing with deliberate dramatic beats" : "Even, mathematical pacing"
        },
        state_telemetry: {
          neutral_state: {
            stability: 75,
            similarity_boost: 75,
            style_exaggeration: 15,
            stress_cues: "Clear level breathing, structured articulation, minimal pausing"
          },
          tension_state: {
            stability: 50,
            similarity_boost: 75,
            style_exaggeration: 35,
            stress_cues: "Frequent dry swallows, slight micro-pauses within phrases, shallow breath support"
          },
          panic_state: {
            stability: 30,
            similarity_boost: 75,
            style_exaggeration: 65,
            stress_cues: "Voice dry-cracking under stress, short caught inhalations, rapid pitch instability"
          }
        },
        monologue_script: `My whole life has been written in parameters. I thought that by designing the rules, I could manage the fallout. But parameters are just lines in the soil. Truth always bleeds through.`
      },
      psychology: {
        social: char.role || "Professional exterior",
        personal: "Vulnerable, terrified of failure",
        core: char.true_character || "A mortal soul searching for genuine contact",
        hidden: char.unconscious_desire || "Sabotaging the design to seek liberation"
      },
      metrics: {
        personality: {
          openness: index === 0 ? 60 : 70,
          conscientiousness: index === 0 ? 85 : 90,
          extraversion: index === 0 ? 30 : 45,
          agreeableness: index === 0 ? 40 : 50,
          neuroticism: index === 0 ? 75 : 60
        },
        quotients: {
          iq: index === 0 ? 128 : 135,
          eq: index === 0 ? 95 : 120,
          pq: index === 0 ? 110 : 105,
          cq: index === 0 ? 115 : 130
        }
      },
      motivation: {
        drive: "Survival & Meaning",
        signature_move: "Highly technical deflection or sudden somatic stillness",
        litmus_test: `${char.name} wants ${char.conscious_desire}, BUT faces biological extinction while battling high guilt, SO they perform the fatal swap.`,
        conscious_desire: char.conscious_desire,
        unconscious_need: char.unconscious_desire,
        empathy_hook: "The visible hand tremor they cannot completely kill",
        dilemma_type: "Irreconcilable Goods",
        dilemma_desc: "Obey corporate survival instructions or surrender to spiritual honesty",
        cinematic_proof: `${char.name} holds the glass. Above them, the orchid shifts colors to deep violet, exposing their hidden heartrate spike.`
      },
      arc: {
        trajectory: "Tragic Transcendence",
        step_1_preparation: "Masked obedience",
        step_2_revelation: "Realizing the partner has preloaded the script",
        step_3_change: "Shifting from calculated poisoner to willing recipient",
        step_4_completion: "Lifting the swapped glass in absolute calm"
      },
      prompts: {
        master_visual_reference: {
          character_name: char.name,
          core_keywords_used: "cinematic portrait, detailed pores, key rim lighting",
          master_grid_prompt: `A master character design reference sheet for ${char.name}, cinematic portrait, detailed pores, wearing tailored corporate wardrobe. The character is 180cm tall. 10-panel 5x2 grid. Top Row: Full-body Front View (0 deg), Full-body 3/4 Front View, Full-body Profile View. Solid light grey background next to a vertical measurement bar. Bottom Row: Neutral Close-up Headshot, Joy, Anger, Sadness.`
        }
      }
    };
  });
}

export function getBlueprintSequences(bp: Blueprint): SequenceMap {
  if (bp.sequences) {
    return bp.sequences;
  }
  if (bp.step_5a_sequence_map) {
    return bp.step_5a_sequence_map;
  }
  return {
    act_one_sequences: [],
    act_two_sequences: [],
    act_three_sequences: []
  };
}

export function getBlueprintBeats(bp: Blueprint): BeatSheet[] {
  if (bp.beats && Array.isArray(bp.beats)) {
    return bp.beats;
  }
  if (bp.step_5b_subtextual_beat_sheets) {
    return bp.step_5b_subtextual_beat_sheets;
  }
  return [];
}

export function getBlueprintLogline(bp: Blueprint): string {
  if (bp.logline) {
    return bp.logline;
  }
  return bp.step_6_master_logline || "No logline compiled.";
}
