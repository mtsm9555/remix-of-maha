import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { MarketplaceListing, ToolManifest, MarketplaceCategory } from "./MarketplaceTypes";

function rowToListing(row: any): MarketplaceListing {
  return {
    manifest: row.manifest_json as ToolManifest,
    downloads: row.downloads,
    rating: row.rating,
    lastUpdated: row.updated_at ?? row.created_at,
    isVerified: row.is_verified,
  };
}

export class MarketplaceStore {
  static async fetchListings(): Promise<MarketplaceListing[]> {
    const { data, error } = await supabaseAdmin
      .from("marketplace_listings")
      .select("*")
      .order("downloads", { ascending: false });
    if (error) throw new Error(`Failed to fetch marketplace: ${error.message}`);
    return (data ?? []).map(rowToListing);
  }

  static async searchTools(query: string, category?: MarketplaceCategory): Promise<MarketplaceListing[]> {
    const all = await MarketplaceStore.fetchListings();
    const q = query.trim().toLowerCase();
    return all.filter((l) => {
      const matchQ =
        q === "" ||
        l.manifest.name.toLowerCase().includes(q) ||
        l.manifest.description.toLowerCase().includes(q) ||
        l.manifest.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = !category || l.manifest.category === category;
      return matchQ && matchCat;
    });
  }

  static async getToolDetails(name: string, version: string): Promise<MarketplaceListing | null> {
    const { data, error } = await supabaseAdmin
      .from("marketplace_listings")
      .select("*")
      .eq("name", name)
      .eq("version", version)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToListing(data) : null;
  }

  static async incrementDownloads(name: string, version: string): Promise<void> {
    const { data } = await supabaseAdmin
      .from("marketplace_listings")
      .select("downloads")
      .eq("name", name)
      .eq("version", version)
      .maybeSingle();
    if (!data) return;
    await supabaseAdmin
      .from("marketplace_listings")
      .update({ downloads: (data.downloads ?? 0) + 1 })
      .eq("name", name)
      .eq("version", version);
  }
}