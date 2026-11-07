// Client phone numbers: Tunisian numbers are formatted, any other number ("Autre",
// the globe button) is typed and stored exactly as given.
//   Tunisia : 8 digits, never starts with 0     -> "22 222 222"
//   Autre   : no formatting at all — a foreign number, a landline extension,
//             anything that doesn't fit the Tunisian shape.
// A Tunisian number never starts with 0, so the country is read from the number
// itself: nothing extra is stored, and the backend search (spaces removed on both
// sides) finds both kinds. A number that is not Tunisian-shaped (leading 0, longer
// than 8 digits) falls back to "Autre" on its own, so typing never truncates it.

export type PhoneCountry = "TN" | "OT";

export const PHONE_COUNTRIES: Record<
  PhoneCountry,
  { label: string; dialCode: string; placeholder: string }
> = {
  TN: { label: "Tunisie", dialCode: "+216", placeholder: "22 222 222" },
  OT: { label: "Autre", dialCode: "", placeholder: "Numéro de téléphone" },
};

export const PHONE_FORMAT_HINT = "Tunisie : XX XXX XXX · Autre : tel quel";

const TN_GROUPS = [2, 3, 3];

// A free-form ("Autre") number still lands in a varchar(20) column.
const FREE_MAX_LEN = 20;

const TN_LEN = TN_GROUPS.reduce((total, size) => total + size, 0);

export const phoneDigits = (value?: string | null): string =>
  (value || "").replace(/\D/g, "");

const groupDigits = (digits: string, groups: number[]): string => {
  const parts: string[] = [];
  let start = 0;
  for (const size of groups) {
    if (start >= digits.length) break;
    parts.push(digits.slice(start, start + size));
    start += size;
  }
  return parts.join(" ");
};

// "+216 22 222 222", "0021622222222" or "21622222222": the 8-digit local number, else null.
const parseTunisianInternational = (digits: string): string | null =>
  digits.match(/^(?:00)?216(\d{8})$/)?.[1] ?? null;

const formatTunisian = (digits: string): string =>
  digits ? groupDigits(digits.slice(0, TN_LEN), TN_GROUPS) : "";

/** A number that can be a Tunisian local number: at most 8 digits, never a leading 0. */
const looksTunisian = (digits: string): boolean =>
  digits.length <= TN_LEN && !digits.startsWith("0");

/**
 * Country of a stored or typed number: "OT" as soon as it cannot be a Tunisian
 * number (so it is left alone rather than mangled), or null while it has no
 * digits at all.
 */
export const detectPhoneCountry = (value?: string | null): PhoneCountry | null => {
  const digits = phoneDigits(value);
  if (!digits) return null;
  if (parseTunisianInternational(digits)) return "TN";
  return looksTunisian(digits) ? "TN" : "OT";
};

/** Formats a phone field as the user types, in the selected country's format. */
export const formatPhoneInput = (value: string, country: PhoneCountry): string => {
  // "Autre" : typed exactly as given, nothing enforced but the column length.
  if (country === "OT") return value.slice(0, FREE_MAX_LEN);

  const digits = phoneDigits(value);
  const local = parseTunisianInternational(digits);
  if (local) return formatTunisian(local);

  // Not a Tunisian number after all: stop reshaping it — truncating would just eat digits.
  // The field then switches to "Autre" by itself (see PhoneInput).
  if (digits.startsWith("0")) return value.slice(0, FREE_MAX_LEN);
  return digits.length > TN_LEN ? digits : formatTunisian(digits);
};

/** Re-formats an existing number after the user picked another country. */
export const convertPhoneCountry = (
  value: string | null | undefined,
  country: PhoneCountry
): string => {
  if (country === "OT") return (value || "").slice(0, FREE_MAX_LEN);
  const digits = phoneDigits(value);
  const local = parseTunisianInternational(digits) ?? digits;
  return formatTunisian(local.replace(/^0+/, ""));
};

/**
 * Formats a search box without ever truncating, so any number can be typed in full.
 * A Tunisian number (with or without +216) is grouped like it is stored; a foreign
 * number keeps all its digits, and spaces and punctuation are dropped, because the
 * backend compares the digits only. Text that is not a phone number is left untouched.
 */
export const formatPhoneSearch = (value: string): string => {
  if (!/^[\d\s+().-]*$/.test(value)) return value;

  const digits = phoneDigits(value);
  const local = parseTunisianInternational(digits);
  if (local) return formatTunisian(local);
  return looksTunisian(digits) ? formatTunisian(digits) : digits;
};

/** Formats a stored number for display; anything unrecognised is shown as stored. */
export const formatPhoneDisplay = (phone?: string | null, fallback = "N/A"): string => {
  if (!phone) return fallback;
  const digits = phoneDigits(phone);
  const local = parseTunisianInternational(digits) ?? digits;
  return local.length === TN_LEN && !local.startsWith("0") ? formatTunisian(local) : phone;
};
