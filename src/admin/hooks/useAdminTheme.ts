import { useEffect, useState, useCallback } from "react";

/**
 * Tema dark/light escopado APENAS ao painel admin.
 * Aplica/remove a classe `.admin-dark` no shell do admin (não no <html>),
 * para não afetar o site público.
 *
 * Persistência: localStorage `lyne.admin.theme` (light | dark).
 * Default: light.
 */

const STORAGE_KEY = "lyne.admin.theme";
export type AdminTheme = "light" | "dark";

function readInitial(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {}
  return "light";
}

function applyToDom(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  const shells = document.querySelectorAll<HTMLElement>(".admin-shell");
  shells.forEach((el) => {
    el.classList.toggle("admin-dark", theme === "dark");
  });
  // Marca também o <html> com data-attr para componentes Radix portados (popovers, sheets)
  // que renderizam em <body> e precisam herdar o tema.
  document.documentElement.setAttribute("data-admin-theme", theme);
}

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>(readInitial);

  // Aplica imediatamente e a cada mudança
  useEffect(() => {
    applyToDom(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  // Reaplica se o shell montar depois (rota admin abrindo)
  useEffect(() => {
    const id = window.setTimeout(() => applyToDom(theme), 0);
    return () => window.clearTimeout(id);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return { theme, setTheme, toggle };
}
