import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Goal = Tables<"goals">;

export function useGoals(referenceMonth?: string) {
  return useQuery({
    queryKey: ["admin", "goals", referenceMonth ?? "current"],
    queryFn: async () => {
      let q = supabase.from("goals").select("*").eq("active", true).order("scope").order("metric");
      if (referenceMonth) q = q.eq("reference_month", referenceMonth);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"goals"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from("goals").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("goals").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "goals"] }),
  });
}
