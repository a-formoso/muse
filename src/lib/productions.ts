import { supabase } from "./supabase";
import type { StoryOption, Blueprint } from "../types";

export interface Production {
  id: string;
  user_id: string;
  title: string | null;
  status: "discovery" | "blueprint" | "screenplay" | "visuals" | "shots" | "assembly";
  story_data: StoryOption | null;
  blueprint_data: Blueprint | null;
  screenplay_text: string | null;
  visual_assets: Record<string, unknown> | null;
  shot_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function saveProduction(
  userId: string,
  productionId: string | null,
  updates: Partial<Omit<Production, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<string | null> {
  if (productionId) {
    const { error } = await supabase
      .from("studio_productions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", productionId)
      .eq("user_id", userId);
    if (error) { console.error("saveProduction update:", error); return null; }
    return productionId;
  } else {
    const { data, error } = await supabase
      .from("studio_productions")
      .insert({ user_id: userId, ...updates })
      .select("id")
      .single();
    if (error) { console.error("saveProduction insert:", error); return null; }
    return data?.id ?? null;
  }
}

export async function loadLatestProduction(userId: string): Promise<Production | null> {
  const { data, error } = await supabase
    .from("studio_productions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as Production;
}

export async function listProductions(userId: string): Promise<Production[]> {
  const { data, error } = await supabase
    .from("studio_productions")
    .select("id, title, status, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(3);
  if (error || !data) return [];
  return data as Production[];
}

export async function deleteProduction(userId: string, productionId: string): Promise<void> {
  await supabase
    .from("studio_productions")
    .delete()
    .eq("id", productionId)
    .eq("user_id", userId);
}
