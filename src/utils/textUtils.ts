/**
 * Turkish text normalization and fuzzy matching helpers for CMMS.
 * Resolves character discrepancies (I vs ı, İ vs i, Ş vs s, etc.) commonly
 * encountered in QR codes, barcodes, and shop-floor input on Android devices.
 */

export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİi]/g, 'i')
    .replace(/[şŞs]/g, 's')
    .replace(/[çÇc]/g, 'c')
    .replace(/[ğĞg]/g, 'g')
    .replace(/[üÜu]/g, 'u')
    .replace(/[öÖo]/g, 'o')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Checks if two strings match loosely (ignoring case, Turkish diacritics, spaces, dashes)
 */
export function areLooseMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normA = normalizeTurkish(a);
  const normB = normalizeTurkish(b);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Containment check if string length is reasonable
  if (normA.length >= 3 && normB.includes(normA)) return true;
  if (normB.length >= 3 && normA.includes(normB)) return true;

  return false;
}
