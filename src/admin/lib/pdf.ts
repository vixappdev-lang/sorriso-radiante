/**
 * pdf.ts — geradores de PDF profissionais para a clínica.
 * Layout A4, cabeçalho com identidade da clínica, tipografia limpa,
 * seções claras e quebra de página automática.
 *
 * Usa jsPDF (sem html2canvas) — texto vetorial, leve e nítido em qualquer zoom.
 */

import jsPDF from "jspdf";

export type ClinicHeader = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  cep?: string;
  cnpj?: string;
};

const PAGE = { w: 210, h: 297 };
const MARGIN = { x: 18, y: 18 };
const CONTENT_W = PAGE.w - MARGIN.x * 2;

/** Cor azul corporativa do design system (HSL 215 75% 38%) → RGB aproximado */
const BRAND = { r: 22, g: 78, b: 142 };
const INK = { r: 22, g: 28, b: 40 };
const MUTED = { r: 110, g: 120, b: 138 };
const LINE = { r: 220, g: 226, b: 234 };

function setFont(doc: jsPDF, size: number, weight: "normal" | "bold" = "normal") {
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
}

function rgb(doc: jsPDF, c: { r: number; g: number; b: number }, type: "text" | "fill" | "stroke" = "text") {
  if (type === "text") doc.setTextColor(c.r, c.g, c.b);
  if (type === "fill") doc.setFillColor(c.r, c.g, c.b);
  if (type === "stroke") doc.setDrawColor(c.r, c.g, c.b);
}

/** Cabeçalho da clínica + faixa de identidade */
function drawHeader(doc: jsPDF, clinic: ClinicHeader, subtitle: string) {
  // Faixa decorativa
  rgb(doc, BRAND, "fill");
  doc.rect(0, 0, PAGE.w, 4, "F");

  // Nome da clínica
  rgb(doc, INK, "text");
  setFont(doc, 16, "bold");
  doc.text(clinic.name, MARGIN.x, 16);

  // Sublinha (tipo do documento)
  rgb(doc, BRAND, "text");
  setFont(doc, 9, "bold");
  doc.text(subtitle.toUpperCase(), MARGIN.x, 22);

  // Bloco direito: contatos
  rgb(doc, MUTED, "text");
  setFont(doc, 8, "normal");
  const right: string[] = [];
  if (clinic.phone) right.push(clinic.phone);
  if (clinic.email) right.push(clinic.email);
  if (clinic.address) right.push(clinic.address);
  if (clinic.cep) right.push("CEP " + clinic.cep);
  if (clinic.cnpj) right.push("CNPJ " + clinic.cnpj);
  let y = 14;
  right.forEach((t) => { doc.text(t, PAGE.w - MARGIN.x, y, { align: "right" }); y += 4; });

  // Linha divisória
  rgb(doc, LINE, "stroke");
  doc.setLineWidth(0.3);
  doc.line(MARGIN.x, 28, PAGE.w - MARGIN.x, 28);
}

function drawFooter(doc: jsPDF, page: number, total: number, clinic: ClinicHeader) {
  rgb(doc, LINE, "stroke");
  doc.setLineWidth(0.2);
  doc.line(MARGIN.x, PAGE.h - 12, PAGE.w - MARGIN.x, PAGE.h - 12);

  rgb(doc, MUTED, "text");
  setFont(doc, 7.5, "normal");
  doc.text(`${clinic.name} · documento gerado eletronicamente`, MARGIN.x, PAGE.h - 7);
  doc.text(`Página ${page} de ${total}`, PAGE.w - MARGIN.x, PAGE.h - 7, { align: "right" });
}

/** Cursor compartilhado para escrita sequencial */
class Cursor {
  y = 34;
  doc: jsPDF;
  clinic: ClinicHeader;
  subtitle: string;
  constructor(doc: jsPDF, clinic: ClinicHeader, subtitle: string) {
    this.doc = doc; this.clinic = clinic; this.subtitle = subtitle;
  }
  ensure(needed: number) {
    if (this.y + needed > PAGE.h - 16) {
      this.doc.addPage();
      drawHeader(this.doc, this.clinic, this.subtitle);
      this.y = 34;
    }
  }
  sectionTitle(text: string) {
    this.ensure(14);
    rgb(this.doc, BRAND, "fill");
    this.doc.rect(MARGIN.x, this.y, 2.5, 6, "F");
    rgb(this.doc, INK, "text");
    setFont(this.doc, 11, "bold");
    this.doc.text(text, MARGIN.x + 5, this.y + 4.6);
    this.y += 9;
  }
  keyValue(label: string, value: string) {
    if (!value) return;
    this.ensure(7);
    setFont(this.doc, 8.5, "bold");
    rgb(this.doc, MUTED, "text");
    this.doc.text(label.toUpperCase(), MARGIN.x, this.y);
    setFont(this.doc, 10, "normal");
    rgb(this.doc, INK, "text");
    const lines = this.doc.splitTextToSize(value, CONTENT_W - 40);
    this.doc.text(lines, MARGIN.x + 38, this.y);
    this.y += Math.max(5, lines.length * 4.6);
  }
  paragraph(text: string, size = 10) {
    if (!text) return;
    setFont(this.doc, size, "normal");
    rgb(this.doc, INK, "text");
    const lines = this.doc.splitTextToSize(text, CONTENT_W);
    lines.forEach((ln: string) => {
      this.ensure(size * 0.6);
      this.doc.text(ln, MARGIN.x, this.y);
      this.y += size * 0.55;
    });
    this.y += 2;
  }
  spacer(n = 4) { this.y += n; }
  divider() {
    this.ensure(4);
    rgb(this.doc, LINE, "stroke");
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN.x, this.y, PAGE.w - MARGIN.x, this.y);
    this.y += 4;
  }
}

function finalize(doc: jsPDF, clinic: ClinicHeader) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, clinic);
  }
}

/* ========================================================================== */
/*                                  ANAMNESE                                  */
/* ========================================================================== */

export type AnamnesisQuestion = { id: string; label: string; type: string; options?: string[]; required?: boolean };

export type AnamnesisPdfInput = {
  clinic: ClinicHeader;
  patient: { name: string; phone: string; email?: string | null };
  template: { name: string; specialty?: string };
  questions: AnamnesisQuestion[] | unknown;
  answers: Record<string, unknown> | unknown;
  signature?: { dataUrl?: string | null; signedAt?: string | null; ip?: string | null; hash?: string | null };
  createdAt?: string | null;
};

export function generateAnamnesisPdf(input: AnamnesisPdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const subtitle = `Anamnese${input.template.specialty ? " · " + input.template.specialty : ""}`;
  drawHeader(doc, input.clinic, subtitle);
  const c = new Cursor(doc, input.clinic, subtitle);
  const questions = Array.isArray(input.questions) ? input.questions as AnamnesisQuestion[] : [];
  const answers = (input.answers && typeof input.answers === "object" ? input.answers : {}) as Record<string, unknown>;

  // Identificação
  c.sectionTitle("Identificação do paciente");
  c.keyValue("Paciente", input.patient.name);
  c.keyValue("Telefone", input.patient.phone);
  if (input.patient.email) c.keyValue("E-mail", input.patient.email);
  if (input.createdAt) c.keyValue("Emitida em", new Date(input.createdAt).toLocaleString("pt-BR"));
  c.spacer(2);

  // Respostas
  c.sectionTitle(input.template.name || "Questionário clínico");
  questions.forEach((q, idx) => {
    const raw = answers?.[q.id];
    const a = Array.isArray(raw) ? raw.join(", ") : (raw ?? "").toString().trim() || "—";
    c.ensure(12);
    setFont(doc, 9, "bold");
    rgb(doc, MUTED, "text");
    const num = String(idx + 1).padStart(2, "0");
    doc.text(`${num}.`, MARGIN.x, c.y);
    setFont(doc, 9.5, "bold");
    rgb(doc, INK, "text");
    const labelLines = doc.splitTextToSize(q.label, CONTENT_W - 8);
    doc.text(labelLines, MARGIN.x + 6, c.y);
    c.y += labelLines.length * 4.4 + 1;

    setFont(doc, 10, "normal");
    rgb(doc, INK, "text");
    const ans = doc.splitTextToSize(a, CONTENT_W - 6);
    ans.forEach((ln: string) => {
      c.ensure(5);
      doc.text(ln, MARGIN.x + 6, c.y);
      c.y += 4.4;
    });
    c.y += 3;
  });

  // Assinatura
  c.spacer(4);
  c.divider();
  c.sectionTitle("Assinatura digital do paciente");

  const sigBoxY = c.y;
  const sigBoxH = 38;
  c.ensure(sigBoxH + 24);

  rgb(doc, LINE, "stroke");
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN.x, sigBoxY, CONTENT_W, sigBoxH, 2, 2);

  if (input.signature?.dataUrl) {
    try {
      doc.addImage(input.signature.dataUrl, "PNG", MARGIN.x + 4, sigBoxY + 3, CONTENT_W - 8, sigBoxH - 6, undefined, "FAST");
    } catch { /* ignore */ }
  } else {
    setFont(doc, 9, "normal");
    rgb(doc, MUTED, "text");
    doc.text("Sem assinatura registrada.", MARGIN.x + 4, sigBoxY + sigBoxH / 2);
  }

  c.y = sigBoxY + sigBoxH + 5;

  setFont(doc, 8.5, "normal");
  rgb(doc, MUTED, "text");
  if (input.signature?.signedAt) {
    doc.text(`Assinada em ${new Date(input.signature.signedAt).toLocaleString("pt-BR")}`, MARGIN.x, c.y);
    c.y += 4;
  }
  if (input.signature?.ip) {
    doc.text(`IP de origem: ${input.signature.ip}`, MARGIN.x, c.y);
    c.y += 4;
  }
  if (input.signature?.hash) {
    const hashLines = doc.splitTextToSize(`Hash SHA-256: ${input.signature.hash}`, CONTENT_W);
    doc.text(hashLines, MARGIN.x, c.y);
    c.y += Math.max(6, hashLines.length * 3.8);
  }
  setFont(doc, 7.5, "normal");
  rgb(doc, MUTED, "text");
  doc.text(
    "Documento eletrônico com validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001. " +
    "A assinatura é vinculada ao paciente identificado, com registro de IP, data/hora e hash criptográfico imutável.",
    MARGIN.x, c.y, { maxWidth: CONTENT_W },
  );

  finalize(doc, input.clinic);
  return doc;
}

/* ========================================================================== */
/*                                 ORÇAMENTO                                  */
/* ========================================================================== */

export type QuoteItem = { name: string; qty: number; price_cents: number };

export type QuotePdfInput = {
  clinic: ClinicHeader;
  patient: { name: string; phone: string; email?: string | null };
  quote: {
    id: string;
    items: QuoteItem[];
    subtotal_cents: number;
    discount_cents: number;
    total_cents: number;
    notes?: string | null;
    status: string;
    created_at: string;
    accepted_at?: string | null;
    expires_at?: string | null;
  };
};

function safeItems(items: unknown): QuoteItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((it: any) => ({
    name: String(it?.name ?? "Procedimento"),
    qty: Math.max(1, Number(it?.qty) || 1),
    price_cents: Math.max(0, Number(it?.price_cents) || 0),
  }));
}

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function generateQuotePdf(input: QuotePdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const subtitle = input.quote.status === "accepted"
    ? "Plano de Tratamento · Aceito"
    : "Plano de Tratamento · Orçamento";
  drawHeader(doc, input.clinic, subtitle);
  const c = new Cursor(doc, input.clinic, subtitle);
  const items = safeItems(input.quote.items);

  // ID do orçamento
  rgb(doc, MUTED, "text");
  setFont(doc, 8.5, "normal");
  doc.text(`Documento nº ${input.quote.id.slice(0, 8).toUpperCase()}`, PAGE.w - MARGIN.x, c.y, { align: "right" });
  c.y += 2;

  c.sectionTitle("Paciente");
  c.keyValue("Nome", input.patient.name);
  c.keyValue("Telefone", input.patient.phone);
  if (input.patient.email) c.keyValue("E-mail", input.patient.email);
  c.keyValue("Emitido em", new Date(input.quote.created_at).toLocaleDateString("pt-BR"));
  if (input.quote.accepted_at) c.keyValue("Aceito em", new Date(input.quote.accepted_at).toLocaleString("pt-BR"));
  if (input.quote.expires_at) c.keyValue("Validade", new Date(input.quote.expires_at).toLocaleDateString("pt-BR"));
  c.spacer(3);

  // Tabela de itens
  c.sectionTitle("Plano de tratamento");
  const colX = { name: MARGIN.x, qty: MARGIN.x + 110, price: MARGIN.x + 130, total: PAGE.w - MARGIN.x };
  // Header tabela
  c.ensure(10);
  rgb(doc, BRAND, "fill");
  doc.rect(MARGIN.x, c.y, CONTENT_W, 7, "F");
  doc.setTextColor(255, 255, 255);
  setFont(doc, 8.5, "bold");
  doc.text("PROCEDIMENTO", colX.name + 2, c.y + 4.7);
  doc.text("QTD", colX.qty, c.y + 4.7, { align: "right" });
  doc.text("VALOR UNIT.", colX.price, c.y + 4.7, { align: "right" });
  doc.text("SUBTOTAL", colX.total - 2, c.y + 4.7, { align: "right" });
  c.y += 7;

  // Linhas
  items.forEach((it, i) => {
    const rowH = 8;
    c.ensure(rowH);
    if (i % 2 === 0) {
      doc.setFillColor(247, 249, 252);
      doc.rect(MARGIN.x, c.y, CONTENT_W, rowH, "F");
    }
    rgb(doc, INK, "text");
    setFont(doc, 9.5, "normal");
    const nameLines = doc.splitTextToSize(it.name, 105);
    doc.text(nameLines[0], colX.name + 2, c.y + 5);
    doc.text(String(it.qty), colX.qty, c.y + 5, { align: "right" });
    doc.text(brl(it.price_cents), colX.price, c.y + 5, { align: "right" });
    setFont(doc, 9.5, "bold");
    doc.text(brl(it.qty * it.price_cents), colX.total - 2, c.y + 5, { align: "right" });
    c.y += rowH;
  });

  // Linha base
  rgb(doc, LINE, "stroke");
  doc.setLineWidth(0.3);
  doc.line(MARGIN.x, c.y, PAGE.w - MARGIN.x, c.y);
  c.y += 4;

  // Totais
  c.ensure(28);
  const totalsX = PAGE.w - MARGIN.x - 70;
  setFont(doc, 9.5, "normal");
  rgb(doc, MUTED, "text");
  doc.text("Subtotal", totalsX, c.y);
  rgb(doc, INK, "text");
  doc.text(brl(input.quote.subtotal_cents), PAGE.w - MARGIN.x, c.y, { align: "right" });
  c.y += 5;

  if (input.quote.discount_cents > 0) {
    rgb(doc, MUTED, "text");
    doc.text("Desconto", totalsX, c.y);
    doc.setTextColor(180, 50, 50);
    doc.text(`- ${brl(input.quote.discount_cents)}`, PAGE.w - MARGIN.x, c.y, { align: "right" });
    c.y += 5;
  }

  c.y += 1;
  rgb(doc, BRAND, "fill");
  doc.rect(totalsX - 4, c.y, PAGE.w - MARGIN.x - totalsX + 4, 10, "F");
  doc.setTextColor(255, 255, 255);
  setFont(doc, 11, "bold");
  doc.text("TOTAL", totalsX, c.y + 6.5);
  doc.text(brl(input.quote.total_cents), PAGE.w - MARGIN.x - 2, c.y + 6.5, { align: "right" });
  c.y += 14;

  if (input.quote.notes) {
    c.sectionTitle("Observações");
    c.paragraph(input.quote.notes, 10);
  }

  // Aceite
  if (input.quote.status === "accepted" && input.quote.accepted_at) {
    c.spacer(2);
    c.divider();
    c.ensure(20);
    rgb(doc, { r: 12, g: 110, b: 70 }, "fill");
    doc.roundedRect(MARGIN.x, c.y, CONTENT_W, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    setFont(doc, 11, "bold");
    doc.text("PLANO ACEITO PELO PACIENTE", MARGIN.x + 4, c.y + 6);
    setFont(doc, 9, "normal");
    doc.text(
      `Aceite registrado em ${new Date(input.quote.accepted_at).toLocaleString("pt-BR")} via link público seguro.`,
      MARGIN.x + 4, c.y + 11,
    );
    c.y += 18;
  } else {
    c.spacer(8);
    c.ensure(40);
    rgb(doc, MUTED, "text");
    setFont(doc, 8.5, "normal");
    doc.text("Assinatura do paciente:", MARGIN.x, c.y);
    doc.text("Data: ____/____/______", PAGE.w - MARGIN.x - 50, c.y);
    c.y += 18;
    rgb(doc, INK, "stroke");
    doc.setLineWidth(0.3);
    doc.line(MARGIN.x, c.y, MARGIN.x + 90, c.y);
    doc.line(PAGE.w - MARGIN.x - 60, c.y, PAGE.w - MARGIN.x, c.y);
    c.y += 4;
    rgb(doc, MUTED, "text");
    setFont(doc, 8, "normal");
    doc.text(input.patient.name, MARGIN.x, c.y);
    doc.text("Profissional responsável", PAGE.w - MARGIN.x, c.y, { align: "right" });
  }

  finalize(doc, input.clinic);
  return doc;
}

/** Helpers de uso */
export function openPdfInNewTab(doc: jsPDF) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function pdfToDataUrl(doc: jsPDF): string {
  return doc.output("dataurlstring");
}

export function pdfToBlobUrl(doc: jsPDF): string {
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
