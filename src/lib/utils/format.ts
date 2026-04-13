import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(
  amount: number,
  currency: "ARS" | "USD" = "ARS"
): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

