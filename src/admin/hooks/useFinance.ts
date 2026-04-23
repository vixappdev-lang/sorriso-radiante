import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type FinanceEntry = Tables<"financial_entries">;

export function useFinance() {
  return useQuery({
    queryKey: ["admin", "finance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_entries").select("*").order("due_date", { ascending: false, nullsFirst: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"financial_entries"> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("financial_entries").update(rest as TablesUpdate<"financial_entries">).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("financial_entries").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "finance"] }),
  });
}

export function useDeleteFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "finance"] }),
  });
}
