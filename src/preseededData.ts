import { StoryOption, Blueprint, StylePreset } from "./types";

export const PRESEEDED_STYLE_PRESET: StylePreset = {
  preset_id: "SP_ORCHID_01",
  title: "Cyber-Noir Greenhouse",
  core_identity: {
    weight: 60,
    label: "Core Cinematic Identity",
    description: "Chiaroscuro cyber-noir — deep black voids anchored by hard, single-source practical lighting. Color dominance is cool slate-black base erupting with warm bioluminescent amber from the orchid flora.",
    elements: [
      "Chiaroscuro hard side-key lighting",
      "Deep shadow voids with minimal fill",
      "Cool slate-black base palette",
      "Warm amber / orange bioluminescent dominance",
      "Anamorphic lens flare on glass and platinum surfaces",
      "Photorealistic — zero stylization artifacts"
    ]
  },
  secondary_influence: {
    weight: 30,
    label: "Secondary Stylistic Influence",
    description: "Bio-horror genre undertones layered with sterile corporate precision. Texture logic alternates between polished synthetic surfaces and living organic matter.",
    elements: [
      "Bio-horror: organic systems responding to human tension",
      "Sterile corporate minimalism (dark lava stone, hermetic glass)",
      "Platinum and crystal metallics as power signals",
      "35mm–50mm anamorphic preset — shallow depth of field",
      "Slow micro-pan movements matching emotional tempo",
      "Soft edge-rim lighting on secondary subjects"
    ]
  },
  accent_layer: {
    weight: 10,
    label: "Accent Layer",
    description: "Defensive orange stress-pulse as the story's visual alarm system. The signet ring rotation anchors betrayal as a recurring symbolic motif.",
    elements: [
      "Defensive orange stress-pulse from orchid bioluminescence",
      "Signet ring rotation — betrayal motif anchor",
      "Glass panel color bleed under atmospheric stress",
      "Bone-white knuckle tension highlight",
      "Cold blue-rim edge accent on antagonist framing"
    ]
  }
};

export const PRESEEDED_OPTIONS: StoryOption[] = [
  {
    "option_id": 1,
    "title": "The Orchid Recessional",
    "step_1_and_2_cosmology_and_actors": {
      "dimensions": {
        "period": "Near-future corporate espionage era",
        "duration": "15 minutes in real-time",
        "location": "Rooftop Bio-Dome Penthouse",
        "conflict_level": "Extra-personal (Corporate) & Personal Conflict"
      },
      "creative_limitation": "Confined to a single dining table set inside a hyper-responsive greenhouse",
      "character_sheets": [
        {
          "name": "Victor Vance",
          "role": "The Corporate Saboteur",
          "characterization": "Impeccably groomed executive chemist. Fastidious, soft-spoken, answers questions with technical dry humor. Has a subtle hand tremor he masks by resting it on his crystal glass.",
          "true_character": "A terrified, blackmailed puppet fearing physical erasure by his handlers.",
          "conscious_desire": "To administer the synthetic toxin 'Aconite-9' into Elena's wine and leave cleanly.",
          "unconscious_desire": "A profound craving to get caught and stopped, ending the exhausting cycle of deception."
        },
        {
          "name": "Dr. Elena Rostova",
          "role": "The Target",
          "characterization": "Genius agricultural director. Observant, cool, with a predator's stillness. Wears a bio-metric smart ring that controls the greenhouse environment.",
          "true_character": "A disillusioned scientist who has already detected Victor's betrayal and wants to see how far his corporate devotion will go.",
          "conscious_desire": "To force Victor into a legal merger confession during dinner.",
          "unconscious_desire": "A self-destructive urge to test if the digital biosphere she built is more loyal to her or to human treachery."
        }
      ]
    },
    "step_3_and_4_meaning_and_props": {
      "premise": "What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?",
      "controlling_idea": "Sovereignty of the soul is reclaimed only when one surrenders the illusion of survival under corporate dominance.",
      "dialectical_debate": {
        "positive_idea": "Corporate duty and clinical detachment ensure survival.",
        "negative_counter_idea": "Vulnerability and mortal truth are the only path to real freedom."
      },
      "props_sheet": [
        {
          "name": "Aerosolized Orchid Syringe",
          "description": "Hidden within the mechanism of a gold champagne opener. Allows Victor to introduce the volatile, odorless chemical into Elena's bio-wine by adjusting the collar."
        },
        {
          "name": "The Bio-Metric Smart Ring",
          "description": "Elena's steel band that connects her pulse and stress response to the greenhouse's digital flora, modulating the environmental color and oxygen feed in real-time."
        },
        {
          "name": "The Cabernet Sympathique",
          "description": "A dynamic hybrid red wine that reacts to human saliva pH shifts, turning opaque and dark purple under acute catecholamine release."
        }
      ]
    }
  },
  {
    "option_id": 2,
    "title": "The Hermetic Sacerdotal",
    "step_1_and_2_cosmology_and_actors": {
      "dimensions": {
        "period": "Post-carbon-collapse transition era",
        "duration": "10 minutes",
        "location": "Subterranean Aeroponic Sanctuary",
        "conflict_level": "Deep Personal & Ideological Conflict"
      },
      "creative_limitation": "The entire room is sealed with pressurized steel bulkheads; any sudden movements trigger automated sterilization mist.",
      "character_sheets": [
        {
          "name": "Chloe Thorne",
          "role": "The SaboteurSommelier",
          "characterization": "Quiet, wearing clinical robes, meticulous somatic control, displays extreme reverence for plants.",
          "true_character": "Grief-stricken mother whose family was displaced by the host's carbon reclamation projects.",
          "conscious_desire": "Introduce heavy-metal compound into the moisture reclaimers, destroying the host's genetic archive.",
          "unconscious_desire": "Desperately seeks to be recognized and forgiven by her victim."
        },
        {
          "name": "Julian Vance",
          "role": "The Patriarch",
          "characterization": "Tech-aristocrat, speaks with absolute authority, skin has a yellowish hue from experimental life-extension therapies.",
          "true_character": "A fragile, aging man terrified of death, seeking proof of spiritual resonance in digital roots.",
          "conscious_desire": "Secure Chloe's lifetime biochemical exclusivity contract.",
          "unconscious_desire": "To yield control of his empire to someone who has suffered from his actions."
        }
      ]
    },
    "step_3_and_4_meaning_and_props": {
      "premise": "What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?",
      "controlling_idea": "Guilt cannot be expiated through automated systems; true absolution requires a face-to-face risk of death.",
      "dialectical_debate": {
        "positive_idea": "The preservation of genetic legacy justifies any human collateral.",
        "negative_counter_idea": "A single raw, immediate moment of genuine guilt outweighs a millennium of synthetic immortality."
      },
      "props_sheet": [
        {
          "name": "Heavy Metal Siphon",
          "description": "A silver watering pipette with a pressurized valve containing mercuric-synth, masquerading as nutrients."
        },
        {
          "name": "Pressurized Dome Vent",
          "description": "Controls the humidity; shifts colors in real-time as atmospheric carbon indices rise and fall."
        }
      ]
    }
  },
  {
    "option_id": 3,
    "title": "Carbon Deficit",
    "step_1_and_2_cosmology_and_actors": {
      "dimensions": {
        "period": "Ultra-capitalist climate market era",
        "duration": "20 minutes",
        "location": "The Carbon-Credit Apex Conservatory",
        "conflict_level": "Personal & Intrapersonal Betrayal"
      },
      "creative_limitation": "A single multi-tiered steel table where the characters are locked in using carbon-fiber safety restraints.",
      "character_sheets": [
        {
          "name": "Marcus Vance",
          "role": "The Venture Saboteur",
          "characterization": "Charismatic, hyper-kinetic, wears a tailored bio-synthetic suit. Cracks jokes constantly to conceal his rising panic.",
          "true_character": "A suicidal idealist who believes corporate carbon offsets are a genocide machine.",
          "conscious_desire": "To infect Sofia's personalized oxygen inhaler with carbon-blocker spores.",
          "unconscious_desire": "To exchange lives with Sofia, taking her place in the corporate execution chamber."
        },
        {
          "name": "Sofia Chen",
          "role": "Chief Operations Officer",
          "characterization": "Strict, mathematical, files digital logs via custom lens overlays. Refuses to touch natural soil.",
          "true_character": "A compromised double-agent who has secretly sold the greenhouse's patents to a state competitor.",
          "conscious_desire": "To finalize the carbon credit transfer and lock Marcus inside the dome.",
          "unconscious_desire": "To find a loophole where the smart system kills her before her betrayals are exposed."
        }
      ]
    },
    "step_3_and_4_meaning_and_props": {
      "premise": "What if a high-ranking corporate saboteur is forced to execute a quiet chemical poisoning during a high-stakes dinner inside a smart, hermetic greenhouse that visually manifests human stress hormones?",
      "controlling_idea": "The monetization of nature triggers an inevitable cellular strike back against its captors.",
      "dialectical_debate": {
        "positive_idea": "Nature is an asset class to be traded and optimized.",
        "negative_counter_idea": "The biosphere is an un-compromisable organism that will choke out those who financialize it."
      },
      "props_sheet": [
        {
          "name": "The Spoiled Inhaler",
          "description": "Sofia's personalized chromium respirator which is primed to receive a targeted gaseous injection of bio-spores."
        },
        {
          "name": "The Carbon-Apex Interface",
          "description": "An interactive digital tablet that displays the real-time oxygen saturation of the greenhouse."
        }
      ]
    }
  },
  {
    "option_id": 4,
    "title": "The Nitrogen Halo",
    "step_1_and_2_cosmology_and_actors": {
      "dimensions": {
        "period": "Post-extinction nitrogen-locked winter era",
        "duration": "12 minutes",
        "location": "Cryo-Temperate Sub-Dome Vault",
        "conflict_level": "Inter-generational & Class Betrayal"
      },
      "creative_limitation": "The oxygen supply decreases by 2% every time a direct question is answered untruthfully, shown via cold blue warning halos.",
      "character_sheets": [
        {
          "name": "Isaac Vance",
          "role": "The Cryo-Saboteur",
          "characterization": "Weathered, shivering elder bio-engineer. Wears heavy insulating thermal robes and speaks in slow, whispering gasps.",
          "true_character": "A dying father who wants to destroy the genetic seed library to prevent elite cloning dynasties.",
          "conscious_desire": "To introduce a slow-acting enzymatic freezing agent into the climate regulatory capsule.",
          "unconscious_desire": "Wants to be entombed alongside his lifework rather than escape back to the surface ruins."
        },
        {
          "name": "Dr. Sylvia Thorne",
          "role": "The Inheritor",
          "characterization": "Sleek, sharp geneticist in military-grade thermal shielding. Precise, carrying herself with cold aristocratic pride.",
          "true_character": "A deep-cover rebel archivist who secretly plans to release the seeds to the outside settlers.",
          "conscious_desire": "To secure the cryo-vault access codes from Isaac before his physical termination.",
          "unconscious_desire": "To have Isaac survive the system purge and find the fatherly validation she was denied."
        }
      ]
    },
    "step_3_and_4_meaning_and_props": {
      "premise": "What if an aging cryo-saboteur must disable a genetic seed library during a sub-zero meeting with his successor within a nitrogen winter vault equipped with automated lie-detecting air halos?",
      "controlling_idea": "Sovereignty over mortal lineage is retrieved only when we allow the old designs to perish for the sake of genuine new life.",
      "dialectical_debate": {
        "positive_idea": "Genetic purity and cold stasis preserve the thread of humanity.",
        "negative_counter_idea": "Organic decay and chaotic rebirth are the only natural path back into light."
      },
      "props_sheet": [
        {
          "name": "Cryo-Enzyme Capsule",
          "description": "A micro-sealed liquid nitrogen vial masked inside a vintage steel thermos, engineered to trigger immediate cell-crystallization upon release."
        },
        {
          "name": "The Truth-Halo Sensor",
          "description": "An airborne scanning scanner that projects a cold, circling blue ring of light over the conversers, erupting with spikes of static frost upon stress spike."
        }
      ]
    }
  }
];

export const PRESEEDED_BLUEPRINT: Blueprint = {
  "title": "The Orchid Recessional",
  "step_1_and_2_cosmology_and_actors": PRESEEDED_OPTIONS[0].step_1_and_2_cosmology_and_actors,
  "step_3_and_4_meaning_and_props": PRESEEDED_OPTIONS[0].step_3_and_4_meaning_and_props,
  "step_5a_sequence_map": {
    "act_one_sequences": [
      {
        "sequence_id": "A1_S1",
        "act": "ACT ONE",
        "actLabel": "Set-Up",
        "title": "The Arrival of the Catalyst",
        "setting_macro": "Rooftop Bio-Dome Penthouse - Night",
        "themeFocus": "Control - Isolation - Illusion",
        "dramatic_arc": "From Superficial Security (Positive) to Cold Apprehension (Negative) as the chemical premise is established.",
        "scenes": [
          {
            "scene_number": 1,
            "setting_micro": "Dining Table - ECU - Wine Bottle Collar",
            "scene_objective": "To introduce the poison silently and establish the polite corporate facade.",
            "opening_value": "Polite Harmony (+)",
            "closing_value": "Undercurrent of Tension (-)",
            "narrative_action": "Victor manipulates the gold opener under Elena's gaze. The greenhouse overhead ferns shift to pale violet.",
            "visualDesc": "A sleek minimalist dining table crafted from dark lava stone, illuminated by bioluminescent orchids suspended in high-altitude canisters."
          }
        ]
      }
    ],
    "act_two_sequences": [
      {
        "sequence_id": "A2_S1",
        "act": "ACT TWO",
        "actLabel": "Confrontation",
        "title": "The Stress Threshold",
        "setting_macro": "Sleek Glass Greenhouse Interior",
        "themeFocus": "Exposure - Disorientation - Subtextual Siege",
        "dramatic_arc": "Value shifts from Secret Maneuver (Negative) to Psychological Exposure (Double Negative) as the environment reacts.",
        "scenes": [
          {
            "scene_number": 2,
            "setting_micro": "Elena's Seat - Medium Close-Up",
            "scene_objective": "Victor must convince Elena to drink the poisoned wine. Elena probes his panic.",
            "opening_value": "Protected Mask (0)",
            "closing_value": "Psychological Exposure (- -)",
            "narrative_action": "Elena's smart ring flashes. The digital vines on the glass ceiling flare with electric amber, betraying Victor's extreme spike in blood pressure.",
            "visualDesc": "The enclosing glass dome is lashed with private rain. Behind Victor, the giant digital monstera leaf bleeds translucent, responsive sap."
          }
        ]
      }
    ],
    "act_three_sequences": [
      {
        "sequence_id": "A3_S1",
        "act": "ACT THREE",
        "actLabel": "Resolution",
        "title": "The Shattering Toast",
        "setting_macro": "Bio-Dome Climax Zone",
        "themeFocus": "Connotation - Transformation - Sovereignty Reclaimed",
        "dramatic_arc": "From Total Vulnerability (Double Negative) to Existential Reclamation (Positive / Soul Sovereignty).",
        "scenes": [
          {
            "scene_number": 3,
            "setting_micro": "The Slate Surface - Wide Angle Table Center",
            "scene_objective": "The final exchange of the glasses. Both must choose to drink of the truth or the toxin.",
            "opening_value": "Standoff (- -)",
            "closing_value": "Tragic Transcendence (+)",
            "narrative_action": "Elena swaps the glasses. The Orchids burst into massive, defensive crimson petals, flooding the sealed room with pure, heavy oxygen.",
            "visualDesc": "A blinding red crimson glow envelopes the table. The rain stops. A heavy silence descends as they lift the switched vessels."
          }
        ]
      }
    ]
  },
  "step_5b_subtextual_beat_sheets": [
    {
      "target_sequence_id": "A1_S1",
      "scene_number": 1,
      "micro_blueprint": {
        "scene_objective": "Introduce the toxin cleanly while playing his corporate executive role.",
        "opening_value": "Surface Equanimity",
        "closing_value": "Suppressed Panic",
        "subtextual_beat_progression": [
          {
            "beat_number": 1,
            "action": "Victor: ALIGNING silverware with surgical precision (Masking nervous hand tremors).",
            "reaction": "Elena: ROTATING her bio-metric smart ring slowly (Signaling dynamic cognitive scanning).",
            "text": "The bio-receptive Cabernet is a marvel, Elena. It takes exactly three minutes in contact with oxygen to fully lock its structural notes.",
            "status": "Polite facade intact. Heartrate 72bpm.",
            "visual_flora": "Suspended air orchids remain pale lavender, a cool, stable resting state.",
            "cinematic_storyboard": [
              {
                "shot_id": "A1_Q1_S1_B1_Sht1",
                "composition": {
                  "framing": "Macro Close-Up (MCU)",
                  "lens_profile": "35mm anamorphic, shallow depth of field",
                  "camera_movement": "Absolute static tripod, high-tension clinical lock",
                  "focal_target": "The hands of Victor beneath the slate table edge"
                },
                "performance_capture": {
                  "primary_actor_id": "char_1",
                  "active_kinetic_token": "Bespoke platinum signet ring being slowly rotated by long, pale fingers, knuckles turning bone-white",
                  "gaze_vector": "Off-camera tracking shot right, pointing down 15-degrees"
                },
                "chroma_and_lighting": {
                  "key_lighting": "Chiaroscuro, high-contrast side-key casting hard shadow across the table slate",
                  "environmental_vfx": "Bioluminescent orchids in the background beginning to pulse with an un-steady, warm orange condensation"
                },
                "automated_image_prompt": "A macro close-up cinematic film still of a man's pale hands under a sleek slate dining table. His fingers compulsively rotate a heavy platinum signet ring, knuckles bone-white with tension. 35mm anamorphic lens, shallow depth of field, high-contrast side-key chiaroscuro lighting. In the soft-focus dark background, hyper-responsive smart greenhouse orchids pulse with a mottled, defensive orange light. Photorealistic, cyber-noir style --ar 16:9"
              },
              {
                "shot_id": "A1_Q1_S1_B1_Sht2",
                "composition": {
                  "framing": "Over-The-Shoulder (OTS)",
                  "lens_profile": "50mm anamorphic preset",
                  "camera_movement": "Slow micro-pan left, matching the 250ms reaction tempo",
                  "focal_target": "The profile silhouette of Elena"
                },
                "performance_capture": {
                  "primary_actor_id": "char_2",
                  "active_kinetic_token": "Rigid posture spine, chin slightly elevated, eyes pinned completely un-blinking onto Victor",
                  "gaze_vector": "Screen left, locked tracking target"
                },
                "chroma_and_lighting": {
                  "key_lighting": "Cool edge-rim reflection illuminating her sharp jawline profile",
                  "environmental_vfx": "The surrounding clean hermetic glass pane reflecting automated orange stress indicators"
                },
                "automated_image_prompt": "An over-the-shoulder medium profile cinematic film still framing a woman with an immaculate, rigid posture and chin slightly elevated. Her eyes are un-blinking, looking toward a man across a dark slate table. Soft cool rim-lighting traces her sharp jawline. The hermetic glass dome panels in the background reflect faint, warning orange atmospheric mist. Photorealistic premium cinematic styling --ar 16:9"
              }
            ]
          },
          {
            "beat_number": 2,
            "action": "Victor: PRESSING the gold opener’s micro-collar (Releasing Aconite-9).",
            "reaction": "Elena: LEANING forward, chin resting on her interwoven fingers (Testing his somatic control).",
            "text": "Yes, but some enzymes are far more delicate. They wither the second the room's atmospheric balance feels artificial.",
            "status": "Subtextual defense. Heartrate 88bpm.",
            "visual_flora": "Canopy ferns tilt 15 degrees downward. Color shifts to soft violet."
          },
          {
            "beat_number": 3,
            "action": "Victor: GRASPING the crystal decanter with a white-knuckled grip (Struggling to manage the poison's volatizing).",
            "reaction": "Elena: SCOOPING a small soil sample with a silver spoon (Invoking physical mortality).",
            "text": "Artificiality is a relative tax on survival. We adapt. We swallow what is required to keep our license.",
            "status": "Value shift. Core stress detected. Heartrate 101bpm.",
            "visual_flora": "A warm amber pulse ripples through the overhead root systems."
          }
        ]
      }
    },
    {
      "target_sequence_id": "A2_S1",
      "scene_number": 2,
      "micro_blueprint": {
        "scene_objective": "Coerce Elena to sip the dynamic Cabernet without letting the dome expose his lies.",
        "opening_value": "Controlled Trap",
        "closing_value": "Absolute Vulnerability",
        "subtextual_beat_progression": [
          {
            "beat_number": 4,
            "action": "Victor: POURING the dynamic fluid with a rigid, frozen wrist (Concealing the molecular gravity of the moment).",
            "reaction": "Elena: TAPPING her metal ring against her slate coaster (Activating the dome's high-sensitivity scanners).",
            "text": "Try it. It represents forty million in agricultural venture. A vintage that literally knows its drinker.",
            "status": "Intense stress. Heartrate 110bpm.",
            "visual_flora": "The glass panes grow mottled with defensive orange condensation."
          },
          {
            "beat_number": 5,
            "action": "Victor: RETRACTING his arms, crossing them tight over his chest (Creating a physical defensive shield).",
            "reaction": "Elena: LIFTING her glass with slow, geometric deliberation, but sniffing the rim (Probing the betrayer’s work).",
            "text": "It smells... metallic. Like modern metallurgy. Tell me, Victor, what is the precise carbon signature of an executive's loyalty?",
            "status": "Acute exposure. Heartrate 119bpm.",
            "visual_flora": "Overhead orchids pulse with rapid, electric amber flashes. The room grows warm."
          }
        ]
      }
    },
    {
      "target_sequence_id": "A3_S1",
      "scene_number": 3,
      "micro_blueprint": {
        "scene_objective": "Face the swapped glasses and decide whether to abort or execute the sovereign self-destruction.",
        "opening_value": "Tactical Deadlock",
        "closing_value": "Tragic Transcendence",
        "subtextual_beat_progression": [
          {
            "beat_number": 6,
            "action": "Victor: STARING at the switched glass, eyes dilated (Experiencing the absolute collapse of the corporate mask).",
            "reaction": "Elena: SWAPPING her own glass back with a razor-sharp snap (Demanding the ultimate dialectical resolution).",
            "text": "If we represent the future of agriculture, Victor, let us drink from the same soil. Yours or mine?",
            "status": "Climax of terror. Heartrate 135bpm.",
            "visual_flora": "The orchids burst into full, spectacular defensive crimson! The glass roof glows blood-red."
          },
          {
            "beat_number": 7,
            "action": "Victor: EXHALING completely, his tremor suddenly vanishing (Choosing spiritual sovereignty over biological cowardice).",
            "reaction": "Elena: DRINKING deeply, keeping her cold, unblinking eyes locked on his (Accepting the tragic, beautiful union).",
            "text": "To total trust, Elena. Free of corporate parameters.",
            "status": "Tragic resolve. Silence. Heartrate stabilizes at 85bpm.",
            "visual_flora": "The deep crimson turns into a thick, ambient, velvet violet, calming as they drink together."
          }
        ]
      }
    }
  ],
  "step_6_master_logline": "Trapped inside a stress-responsive smart greenhouse, an elite corporate saboteur must execute a quiet chemical poisoning during a high-stakes dinner with a brilliant agricultural director who has already mapped his betrayal, forcing a deadly sequence of subtextual maneuvers where their secrets are written in the glowing digital flora above."
};

export const PRESEEDED_SCRIPT = `SCENE_1: THE ARRIVAL OF THE CATALYST

INT. ROOFTOP BIO-DOME PENTHOUSE - NIGHT

A cold, razor-sharp silence hangs over the slate-carved dining table. Outside, high-altitude rain lashes the hermetic geodesic dome, refracting the charcoal skyline of New Tokyo.

Suspended in chrome bio-receptive canisters above the table are rows of HYBRID AIR ORCHIDS. Their roots crawl through transparent nutrient gel, glowing with a soft, resting resting PALE LAVENDER.

VICTOR VANCE (40s) sits with clinical stillness. He wears a tailored charcoal knit suit, his hair swept back with surgical order. He is ALIGNING his dessert fork with his knife, moving them exactly three millimeters to the left to match the plate's absolute coordinates. His fingers tremor subtly, a tiny spasm he kills by pressing his hand flat against the slate.

Across the slate sits DR. ELENA ROSTOVA (30s). She wears a clean, white tailored vest over her bare shoulders, looking less like a host and more like a high-altitude observer. On her left ring finger sits a dark metal BIO-METRIC SMART RING. It pulses in sync with her steady, unhurried heartbeat.

She is ROTATING the ring slowly, staring at Victor’s left wrist.

VICTOR
The bio-receptive Cabernet is a marvel, Elena. It takes exactly three minutes in contact with oxygen to fully lock its structural notes.

ELENA
(Her fingers resting on the ring)
Yes, but some enzymes are far more delicate. They wither the second the room's atmospheric balance feels artificial.

VICTOR'S chest hitches slightly. An air sensor in his collar registers a carbon puff. 

In the canopy above, the Orchid root systems tilt 15 degrees downward. Their luminescence shifts from cool lavender to a defensive, deeper VIOLET.

Victor reaches for the bottle of dynamic Cabernet. His left hand is stiff. He adjusts the gold collar of the champagne-styled opener. His thumb slides down a concealed micro-valve.

A tiny, microscopic hiss of compressed air escapes. 

VICTOR
Artificiality is a relative tax on survival. We adapt. We swallow what is required to keep our license.

Victor pours the dark, viscous fluid into her crystal glass.

SCENE_2: THE STRESS THRESHOLD

INT. ROOFTOP BIO-DOME PENTHOUSE - LATER

The glasses are full. The fluid within them is dark, thick, almost black.

Elena does not touch hers. She TAPS her bio-metric ring against her heavy slate coaster. A subtle, rhythmic clicking echoing.

At the click, the glass panels of the greenhouse dome grow mottled with a defensive, warm ORANGE CONDENSATION. The high-altitude rain outside seems louder, heavier.

Victor lies back in his seat, RETRACTING his arms and crossing them tight over his chest, sealing himself off. His heart rate is climbing.

ELENA
Try it. It represents forty million in agricultural venture. A digital vintage that literally knows its drinker.

Victor’s fingers dig into his sleeves.

ELENA (CONT'D)
It smells... metallic. Like modern metallurgy. Tell me, Victor, what is the precise carbon signature of an executive's loyalty?

Above Victor’s head, a giant hybrid leaf bleeds a single drops of thick, bioluminescent amber sap.

The overhead canopy reacts with rapid, electric AMBER FLASHES. The room's temperature is rising. Victor is exposed.

SCENE_3: THE SHATTERING TOAST

INT. ROOFTOP BIO-DOME PENTHOUSE - NIGHT

The standoff is absolute. Both glasses sit in the center of the dark slate table.

Elena leans forward. She reaches out and systematically slides Victor's glass toward herself, and pushes her glass to his side of the table.

Victor stares at the swapped glass. His pupils dilate. His breathing stops.

ELENA
If we represent the future of agriculture, Victor, let us drink from the same soil. Yours or mine?

Victor looks up. He sees his reflection in the bio-responsive dome. The orchids have burst into wide, spectacular blooms of DEFENSIVE CRIMSON. The entire room is bathed in a clinical, blood-red bioluminescence.

His hand tremor suddenly stops. He exhales completely. He reaches out and grasps the poisoned glass. He looks into her eyes with a quiet, terrifying calm.

VICTOR
To total trust, Elena. Free of corporate parameters.

They lift their glasses. The crimson light above pulses slow, dense, and warm, shifting into a deep, velvety, red-violet glow of resolution as they drink.

FADE OUT.`;
