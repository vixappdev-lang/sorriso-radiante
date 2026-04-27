import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type RecallTask = Tables<"recall_tasks">;

export function useRecallTasks(filter: "due" | "all" = "due") {
  return useQuery({
    queryKey: ["admin", "recall_tasks", filter],
    queryFn: async () => {
      let q = supabase.from("recall_tasks").select("*").order("due_date", { ascending: true });
      if (filter === "due") q = q.eq("status", "pending");
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as RecallTask[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"recall_tasks"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from("recall_tasks").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("recall_tasks").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "recall_tasks"] }),
  });
}

export function useDeleteRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recall_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "recall_tasks"] }),
  });
}
