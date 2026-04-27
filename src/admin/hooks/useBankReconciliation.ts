import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BankStatement = Tables<"bank_statements">;
export type BankStatementLine = Tables<"bank_statement_lines">;

export function useBankStatements() {
  return useQuery({
    queryKey: ["admin", "bank_statements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_statements").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as BankStatement[];
    },
  });
}

export function useStatementLines(statementId?: string) {
  return useQuery({
    queryKey: ["admin", "bank_statement_lines", statementId],
    enabled: !!statementId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_statement_lines").select("*").eq("statement_id", statementId!).order("posted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BankStatementLine[];
    },
  });
}

export function useImportStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      bank_name: string;
      account: string;
      lines: { posted_at: string; description: string; amount_cents: number; raw_id?: string }[];
    }) => {
      const { data: ures } = await supabase.auth.getUser();
      const dates = payload.lines.map((l) => l.posted_at).sort();
      const { data: stmt, error: e1 } = await supabase
        .from("bank_statements")
        .insert({
          bank_name: payload.bank_name,
          account: payload.account,
          period_start: dates[0] ?? null,
          period_end: dates[dates.length - 1] ?? null,
          total_lines: payload.lines.length,
          imported_by: ures.user?.id ?? null,
        })
        .select()
        .single();
      if (e1) throw e1;
      const rows = payload.lines.map((l) => ({ ...l, statement_id: stmt.id }));
      const { error: e2 } = await supabase.from("bank_statement_lines").insert(rows as any);
      if (e2) throw e2;
      return stmt;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "bank_statements"] });
    },
  });
}

export function useReconcileLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { line_id: string; entry_id: string; statement_id: string }) => {
      const { data: ures } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("bank_statement_lines")
        .update({ matched_entry_id: payload.entry_id, matched_at: new Date().toISOString(), matched_by: ures.user?.id ?? null })
        .eq("id", payload.line_id);
      if (error) throw error;
      // marca a entry como paga
      await supabase.from("financial_entries").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payload.entry_id);
      // recalcula reconciled count
      const { count } = await supabase
        .from("bank_statement_lines")
        .select("*", { count: "exact", head: true })
        .eq("statement_id", payload.statement_id)
        .not("matched_entry_id", "is", null);
      await supabase.from("bank_statements").update({ reconciled_lines: count ?? 0 }).eq("id", payload.statement_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "bank_statement_lines"] });
      qc.invalidateQueries({ queryKey: ["admin", "bank_statements"] });
      qc.invalidateQueries({ queryKey: ["admin", "finance"] });
    },
  });
}
