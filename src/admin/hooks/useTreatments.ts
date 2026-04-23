import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TreatmentOverride = Tables<"treatments_overrides">;

export function useTreatmentOverrides() {
  return useQuery({
    queryKey: ["admin", "treatments_overrides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments_overrides").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertTreatment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"treatments_overrides">) => {
      const { data, error } = await supabase
        .from("treatments_overrides")
        .upsert(payload as any, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "treatments_overrides"] }),
  });
}

export function useDeleteTreatment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("treatments_overrides").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "treatments_overrides"] }),
  });
}
