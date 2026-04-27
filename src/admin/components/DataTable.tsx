import { ReactNode, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  accessor?: (row: T) => string | number | null | undefined;
};

export default function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchable,
  searchPlaceholder = "Buscar…",
  searchKeys,
  pageSize = 10,
  empty,
  rowActions,
  onRowClick,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  empty?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchable) return rows;
    const Q = q.toLowerCase();
    return rows.filter((r) => {
      const keys = searchKeys ?? (Object.keys(r as object) as (keyof T)[]);
      return keys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(Q));
    });
  }, [rows, q, searchable, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="admin-card overflow-hidden">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-[hsl(var(--admin-border))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="h-9 pl-9" />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/55 text-xs uppercase tracking-wider text-[hsl(var(--admin-text-muted))]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("text-left px-4 py-3 font-medium", c.className)}>
                  {c.header}
                </th>
              ))}
              {rowActions && <th className="px-4 py-3 text-right font-medium w-1">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-4 py-12">
                  {empty ?? <p className="text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>}
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={(row.id as any) ?? i}
                  className={cn("border-t border-[hsl(var(--admin-border))] transition-colors", onRowClick && "cursor-pointer hover:bg-muted/45")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-2 border-t border-[hsl(var(--admin-border))] px-4 py-3 text-xs text-[hsl(var(--admin-text-muted))]">
          <span>
            Mostrando <strong className="text-[hsl(var(--admin-text))]">{(safePage - 1) * pageSize + 1}</strong>–
            <strong className="text-[hsl(var(--admin-text))]">{Math.min(safePage * pageSize, filtered.length)}</strong> de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-[hsl(var(--admin-text))]">{safePage} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
