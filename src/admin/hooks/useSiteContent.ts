import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type SiteContent = Tables<"site_content">;

export function useSiteContent() {
  return useQuery({
    queryKey: ["admin", "site_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
  });
}

export function useUpsertSiteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"site_content">) => {
      const { data, error } = await supabase.from("site_content").upsert(payload as any, { onConflict: "key" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "site_content"] }),
  });
}

export type LandingPage = Tables<"landing_pages">;
export function useLandingPages() {
  return useQuery({
    queryKey: ["admin", "landing_pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_pages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"landing_pages"> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("landing_pages").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("landing_pages").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "landing_pages"] }),
  });
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "landing_pages"] }),
  });
}
