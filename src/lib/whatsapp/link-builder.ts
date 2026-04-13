/**
 * Builds a wa.me link with pre-filled message.
 * Phone should be in format with country code, e.g. "5492324401234"
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  // Clean phone: remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If starts with 0, assume Argentina and prepend 54
  if (cleaned.startsWith("0")) {
    cleaned = "54" + cleaned.substring(1);
  }

  // If doesn't start with country code, assume Argentina
  if (!cleaned.startsWith("54") && !cleaned.startsWith("+")) {
    cleaned = "54" + cleaned;
  }

  cleaned = cleaned.replace("+", "");

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
