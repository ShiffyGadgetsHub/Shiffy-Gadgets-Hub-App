export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const withCountryCode = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
