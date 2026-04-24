import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BookingLink = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  professional_slug: string | null;
  treatment_slug: string | null;
  active: boolean;
  created_at: string;
};

export function useBookingLinks() {
  return useQuery({
    queryKey: ["admin", "booking_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_booking_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingLink[];
    },
  });
}

export function useUpsertBookingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BookingLink> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("public_booking_links").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("public_booking_links").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "booking_links"] }),
  });
}

export function useDeleteBookingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("public_booking_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "booking_links"] }),
  });
}
