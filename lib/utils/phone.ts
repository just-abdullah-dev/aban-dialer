/**
 * Phone Number Utilities
 *
 * E.164 phone number validation and formatting
 * E.164 format: +[country code][number] (e.g., +14155551234)
 */

/**
 * Validates if a string is a valid E.164 phone number
 */
export function isValidE164(phone: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Formats a phone number to E.164 format
 * Attempts common conversions for US/AU numbers
 */
export function formatToE164(phone: string, country?: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Already in E.164 format
  if (phone.startsWith("+") && isValidE164(phone)) {
    return phone;
  }

  // US number conversions
  if (country === "US") {
    if (digits.length === 10) {
      // 10 digits: add +1
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      // 11 digits starting with 1: add +
      return `+${digits}`;
    }
  }

  // Australian number conversions
  if (country === "AU") {
    if (digits.length === 9) {
      // 9 digits: add +61
      return `+61${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("61")) {
      // 11 digits starting with 61: add +
      return `+${digits}`;
    }
  }

  // Try adding country code if we have 10+ digits
  if (digits.length >= 10) {
    const guessedNumber = `+${digits}`;
    if (isValidE164(guessedNumber)) {
      return guessedNumber;
    }
  }

  return null;
}

/**
 * Formats an E.164 number for display
 * +14155551234 -> +1 (415) 555-1234
 * +61398765432 -> +61 3 9876 5432
 */
export function formatForDisplay(e164: string): string {
  if (!isValidE164(e164)) {
    return e164;
  }

  // US numbers (+1)
  if (e164.startsWith("+1") && e164.length === 12) {
    const areaCode = e164.substring(2, 5);
    const prefix = e164.substring(5, 8);
    const line = e164.substring(8);
    return `+1 (${areaCode}) ${prefix}-${line}`;
  }

  // Australian numbers (+61)
  if (e164.startsWith("+61") && e164.length === 12) {
    const areaCode = e164.substring(3, 4);
    const part1 = e164.substring(4, 8);
    const part2 = e164.substring(8);
    return `+61 ${areaCode} ${part1} ${part2}`;
  }

  // Default: just add space after country code
  const match = e164.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return e164;
}

/**
 * Detects country from E.164 phone number
 */
export function detectCountry(e164: string): string | null {
  if (!isValidE164(e164)) {
    return null;
  }

  if (e164.startsWith("+1")) return "US";
  if (e164.startsWith("+61")) return "AU";
  if (e164.startsWith("+44")) return "UK";
  if (e164.startsWith("+64")) return "NZ";
  if (e164.startsWith("+91")) return "IN";
  if (e164.startsWith("+92")) return "PK";

  return null;
}
