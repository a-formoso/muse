export type TierName = "none" | "trial" | "playwright" | "director" | "studio";

export interface AccessTier {
  tier: TierName;
  /** Highest phase number allowed. playwright=3, all others=6 */
  phases_allowed: number;
  studio_productions_limit: number | null;
  character_grids_limit: number | null;
  shot_generations_limit: number | null;
  video_promotions_limit: number | null;
}

export const TIERS: Record<TierName, AccessTier> = {
  none: {
    tier: "none",
    phases_allowed: 0,
    studio_productions_limit: 0,
    character_grids_limit: 0,
    shot_generations_limit: 0,
    video_promotions_limit: 0,
  },
  trial: {
    tier: "trial",
    phases_allowed: 3,
    studio_productions_limit: 1,
    character_grids_limit: 0,
    shot_generations_limit: 0,
    video_promotions_limit: 0,
  },
  playwright: {
    tier: "playwright",
    phases_allowed: 3,
    studio_productions_limit: 3,
    character_grids_limit: 0,
    shot_generations_limit: 0,
    video_promotions_limit: 0,
  },
  director: {
    tier: "director",
    phases_allowed: 6,
    studio_productions_limit: 3,
    character_grids_limit: 15,
    shot_generations_limit: 30,
    video_promotions_limit: 10,
  },
  studio: {
    tier: "studio",
    phases_allowed: 6,
    studio_productions_limit: null,
    character_grids_limit: 50,
    shot_generations_limit: 150,
    video_promotions_limit: 50,
  },
};

export interface UsageState {
  productions_used: number;
  character_grids_used: number;
  shot_generations_used: number;
  video_promotions_used: number;
}

export function isUnlimited(limit: number | null): limit is null {
  return limit === null;
}

export function usageLabel(used: number, limit: number | null): string {
  if (limit === null) return "∞";
  return `${used} / ${limit}`;
}

export function isLimitReached(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit;
}

export function canAccessPhase(tier: AccessTier, phase: number): boolean {
  return phase <= tier.phases_allowed;
}
