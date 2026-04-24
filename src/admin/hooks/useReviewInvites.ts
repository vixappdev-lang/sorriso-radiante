import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReviewInvite = {
  id: string;
  token: string;
  patient_name: string;
  patient_phone: string | null;
  professional: string | null;
  treatment: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export function useReviewInvites() {
  return useQuery({
    queryKey: ["admin", "review_invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewInvite[];
    },
  });
}

export function useCreateReviewInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { patient_name: string; patient_phone?: string; professional?: string; treatment?: string }) => {
      const { data, error } = await supabase
        .from("review_invites")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as ReviewInvite;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "review_invites"] }),
  });
}

export function useDeleteReviewInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("review_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "review_invites"] }),
  });
}
