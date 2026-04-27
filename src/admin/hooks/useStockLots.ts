import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type StockLot = Tables<"stock_lots">;

export function useStockLots(itemId?: string) {
  return useQuery({
    queryKey: ["admin", "stock_lots", itemId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("stock_lots").select("*").order("expiry_date", { ascending: true, nullsFirst: false });
      if (itemId) q = q.eq("item_id", itemId);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as StockLot[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"stock_lots"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from("stock_lots").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("stock_lots").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stock_lots"] }),
  });
}

export function useDeleteLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_lots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stock_lots"] }),
  });
}
