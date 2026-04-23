import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Promotion = Tables<"site_promotions">;

export function usePromotions() {
  return useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_promotions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"site_promotions"> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("site_promotions").update(rest as TablesUpdate<"site_promotions">).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("site_promotions").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promotions"] }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promotions"] }),
  });
}
