# Muse — Story Blueprint (Canonical Spec)

> The craft foundation Muse implements. Source: the "Director's Kit" distillation of
> **Robert McKee's _Story_**. This document is the source of truth that the generation
> prompts and data schemas must answer to. When in doubt about a field's intent or a
> prompt's instruction, this is the reference.

---

## Part I — The McKee framework Muse encodes

### A. Anatomy of story design (the nested hierarchy)
A story is **meaningful change driven by conflict**, never a collection of activity.

- **Story Value** — a binary quality of human experience that can flip charge (life/death,
  truth/lie, freedom/slavery, love/hate, success/failure).
- **Story Event** — a moment that turns a value through conflict. If no value changes, it is
  a non-event (exposition or empty activity) and should be cut.

The five nested building blocks, smallest → largest:

1. **Beat** — an exchange of behaviour in **action/reaction**. Beats shift a scene's direction.
2. **Scene** — beats culminating in a **Turning Point**; action through conflict in continuous
   time/space. **Every true scene must turn at least one value from + to − or − to +.** If it
   doesn't turn, cut it.
3. **Sequence** — 2–5 scenes building to a **capping scene** of greater impact.
4. **Act** — sequences peaking in a **climactic** scene: a major, harder reversal.
5. **Story** — acts building to the **Story Climax**: an absolute, **irreversible** change.

Reversibility scales with the unit: scene/sequence/early-act changes are usually temporary;
the Story Climax is permanent.

### B. Setting — the four dimensions
A setting is a precise frame defining what is possible/probable:
- **Period** — place in time.
- **Duration** — elapsed time across the telling.
- **Location** — physical space / specific geography.
- **Level of Conflict** — position on the hierarchy of struggle (inner / personal / extra-personal).

**Principle of Creative Limitation:** choose a small, strictly knowable world. "Anywhere,
anytime" forces superficiality. The writer must end with commanding ("divine") knowledge of
the world. Research has three pillars: **Memory, Imagination, Fact.**

### C. Character
- **Characterization** — the observable mask (age, speech, dress, career, quirks).
- **True Character** — essential nature, revealed only by **choice under pressure**. Choice with
  nothing at stake reveals nothing.
- **Character Arc** — the finest work changes the inner nature across the telling (e.g. _The
  Verdict_: corrupt drunk → ethical attorney).
- **Structure ↔ Character are one:** choices under pressure define character; character dictates
  events. Change one, change the other.
- **Empathy ≠ sympathy.** Likability is optional; an instinctive "this is like me" bond is
  mandatory (even Macbeth).
- **Will & desire:** the protagonist is willful and has a **conscious** object of desire; the
  richest also carry an **unconscious** desire that contradicts it.
- **Three levels of conflict** ripple outward from the self: **Inner → Personal → Extra-personal.**

### D. Meaning
- **Premise** — the open "What if…?" question that sparks the work (a starting point, not precious).
- **Controlling Idea** — the definitive meaning expressed by the climax. Always a full sentence:
  - **Controlling Idea = Value + Cause** (the charge that arrives at climax, and the cause that drove it).
  - e.g. _In the Heat of the Night_: justice is restored (+) because an outsider sees the truth (cause).
- **Three grand categories** by final charge:
  - **Idealistic** (up-ending) — life as we wish it.
  - **Pessimistic** (down-ending) — life as we dread it.
  - **Ironic** (up/down) — gain and loss fused in one action; the hardest to write.

### E. Mechanics of progression
- **Inciting Incident** — a dynamic event that **radically upsets the protagonist's balance**,
  launching the quest and the **Spine** (super-objective). Onscreen, ideally within the first
  ~25%. Arises by **decision** or **coincidence**. May be setup + payoff (don't separate them
  with dead exposition). Provokes the **Major Dramatic Question** / "Big Hook" and foreshadows
  the obligatory Crisis/Climax. Brainstorm by pushing to the **best/worst** case.
- **Act design** — three acts minimum for a feature. The long second act is broken up by
  **multiplying acts** (mid-act climax) or **subplots**.
- **Subplots** — four structural relations to the Controlling Idea: **Contradict, Resonate,
  Open** (cover a delayed central plot), **Complicate**.
- **Act rhythm** — **alternating charges** (don't stack two up-endings); the **false ending**.

### F. Composition & analytical execution
- **Composition canons:** Unity & Variety, Pacing, Rhythm & Tempo, Progression, Symbolic/Ironic
  Ascension, Transition. (Unity = every beat causally locked from Inciting Incident to Climax via
  the Spine.)
- **Progression techniques:** Social, Personal, **Symbolic** and **Ironic Ascension** (the 6
  ironic patterns: late attainment, misguided success, tragic sacrifice, counterproductive steps,
  self-destructive salvation, the curative gift).
- **Scene design & subtext:**
  - **Scene-Objective** (this scene's goal) is an aspect of the **Super-Objective / Spine**.
  - **The Gap** — choice meets an unexpected reaction; the gap between expectation and result is
    what turns the scene.
  - **Text vs Subtext** — never write "on the nose"; drama lives in the unspoken.
  - **5-step scene analysis:** (1) define conflict (desire vs antagonism as active infinitives),
    (2) note opening value, (3) break into beats naming subtextual verbs, (4) note closing value
    & compare, (5) locate the turning point.
  - Canonical model: the **Casablanca bazaar grid** — each beat = Rick's subtextual action vs
    Ilsa's subtextual reaction, ending on the turn.

---

## Part II — How the framework maps to Muse today

Muse's data model is a near 1:1 encoding of the framework. The generation system prompt is
explicitly "governed by Robert McKee (Story) and Stanislavskian behavioral subtext."

| McKee mechanic | Muse field / location |
|---|---|
| Beat → Scene → Sequence → Act → Story | Phase 2 `sequences` (acts→sequences→scenes) + `beats` |
| A scene must **turn** a value | `scene.opening_value` → `scene.closing_value` |
| Turning Point / the Gap | beat `subtextual_beat_progression` + the value flip |
| Four dimensions of setting | `setting.dimensions` {period, duration, location, conflict_level} |
| Principle of Creative Limitation | `setting.creative_limitation` |
| Controlling Idea = Value + Cause | `meaning.controlling_idea` |
| Dialectical argument (thesis/antithesis) | `meaning.dialectical_debate` {positive_idea, negative_counter_idea} |
| Characterization vs True Character | `psychology.social` vs `psychology.core` / `psychology.hidden` |
| Conscious vs Unconscious Desire | `motivation.conscious_desire` / `motivation.unconscious_need` |
| Empathy (not sympathy) | `motivation.empathy_hook` |
| Character Arc (revelation → change) | `arc.step_1_preparation … step_4_completion` |
| The Spine / Super-objective | character `gravity` |
| Scene-Objective | `scene.scene_objective` |
| **Casablanca grid: action / reaction / text / subtext** | beat `{action, reaction, text, status}` |
| Props as narrative catalysts | `meaning.props_sheet` |

### Pipeline ↔ framework
- **Phase 1 (Discovery)** — Premise → Setting (4 dimensions + creative limitation), Meaning
  (Controlling Idea + dialectic), and a character roster → full bibles (characterization, true
  character, conscious/unconscious desire, arc, empathy).
- **Phase 2 (Blueprint)** — the nested hierarchy: acts → sequences → scenes (each with
  opening/closing value), then per-scene **subtextual beat sheets** (the 5-step grid).
- **Phase 3 (Screenplay)** — scenes written **from the subtext out** (8 screenplay laws), never
  on the nose.

---

## Part III — Gap roadmap (framework not yet first-class)

Ordered by craft leverage. Items 1–2 are in progress; 3–4 are larger efforts.

1. **Inciting Incident** — a first-class field on the option: the event, its origin
   (decision/coincidence), and the Major Dramatic Question it provokes. *(adding)*
2. **Ending charge** — tag each option's Controlling Idea as **Idealistic / Pessimistic /
   Ironic**, surfaced in the UI. *(adding)*
3. **Subplots** — model the 4 subplot relations (contradict / resonate / open / complicate);
   requires extending Phase 2/3 from single-plot to multi-plot. *(larger; separate effort)*
4. **Progression & composition controls** — social/personal/symbolic/ironic ascension, act
   rhythm (alternating charges, mid-act climax, false ending), pacing/tempo, transitions. *(later)*

### Invariants the generators must honour
- Every scene **turns** (opening_value ≠ closing_value); a flat scene is a bug.
- Every beat names a **subtextual verb** for both action and reaction; text ≠ subtext.
- The Controlling Idea is always **Value + Cause** as a full sentence — never a single word.
- Each character carries a conscious desire **and** a contradicting unconscious need.
- The Spine (the protagonist's drive to restore balance) is the causal lock from Inciting
  Incident to Story Climax.
