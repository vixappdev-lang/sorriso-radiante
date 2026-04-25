import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type StockItem = Tables<"stock_items">;
export type StockMovement = Tables<"stock_movements">;

export function useStockItems() {
  return useQuery({
    queryKey: ["admin", "stock_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as StockItem[];
    },
    staleTime: 30_000,
  });
}

export function useStockMovements(itemId?: string) {
  return useQuery({
    queryKey: ["admin", "stock_movements", itemId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(200);
      if (itemId) q = q.eq("item_id", itemId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as StockMovement[];
    },
  });
}

export function useUpsertStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"stock_items"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from("stock_items").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("stock_items").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stock_items"] }),
  });
}

export function useDeleteStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stock_items"] }),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { item_id: string; type: "in" | "out" | "adjust"; qty: number; reason?: string | null }) => {
      const { data: ures } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({ ...payload, created_by: ures.user?.id ?? null } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "stock_items"] });
      qc.invalidateQueries({ queryKey: ["admin", "stock_movements"] });
    },
  });
}
