export function formatCurrency(amount: number): string {
  return `S/${amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function generateQuotationNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `COT-${dateStr}-${random}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}
