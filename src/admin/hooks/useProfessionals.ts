import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Professional = Tables<"professionals">;

export function useProfessionals() {
  return useQuery({
    queryKey: ["admin", "professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"professionals"> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("professionals").update(rest as TablesUpdate<"professionals">).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("professionals").insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "professionals"] }),
  });
}

export function useDeleteProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "professionals"] }),
  });
}
