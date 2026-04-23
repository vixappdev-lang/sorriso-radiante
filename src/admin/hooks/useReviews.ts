import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Review = Tables<"reviews">;

export function useReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"reviews">) => {
      const { data, error } = await supabase.from("reviews").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const { error } = await supabase.from("reviews").update({ reply, replied_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}
