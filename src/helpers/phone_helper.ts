// Client phone numbers for the two supported countries, plus a free "Autre"
// mode for everything else.
//   Tunisia : 8 digits, never starts with 0          -> "22 222 222"
//   Algeria : national format, always starts with 0
//             mobile (05 / 06 / 07) 10 digits        -> "0555 12 34 56"
//             landline 9 digits                      -> "021 23 45 67"
//   Autre   : typed and stored exactly as given, no formatting at all —
//             for a foreign number, a landline extension, anything that
//             doesn't fit the two shapes above.
// A Tunisian number never starts with 0 and an Algerian one always does, so the
// country is read from the number itself: nothing extra is stored, and the backend
// search (digits compared without spaces) finds both formats. A number longer
// than either shape falls back to "Autre" on its own, so typing never truncates it.

export type PhoneCountry = "TN" | "DZ" | "OT";

export const PHONE_COUNTRIES: Record<
  PhoneCountry,
  { label: string; dialCode: string; placeholder: string }
> = {
  TN: { label: "Tunisie", dialCode: "+216", placeholder: "22 222 222" },
  DZ: { label: "Algérie", dialCode: "+213", placeholder: "0555 12 34 56" },
  OT: { label: "Autre", dialCode: "", placeholder: "Numéro de téléphone" },
};

export const PHONE_FORMAT_HINT = "Tunisie : XX XXX XXX · Algérie : 0XXX XX XX XX · Autre : tel quel";

const TN_GROUPS = [2, 3, 3];
const DZ_MOBILE_GROUPS = [4, 2, 2, 2];
const DZ_LANDLINE_GROUPS = [3, 2, 2, 2];

// A free-form ("Autre") number still lands in a varchar(20) column.
const FREE_MAX_LEN = 20;

const sum = (groups: number[]) => groups.reduce((total, size) => total + size, 0);
const TN_LEN = sum(TN_GROUPS);
const DZ_MAX_LEN = Math.max(sum(DZ_MOBILE_GROUPS), sum(DZ_LANDLINE_GROUPS));

const dzGroups = (local: string) =>
  /^0[5-7]/.test(local) ? DZ_MOBILE_GROUPS : DZ_LANDLINE_GROUPS;

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

// "+216 22 222 222", "0021622222222", "+213 555 12 34 56", "+213 0555 12 34 56"
const parseInternational = (
  digits: string
): { country: "TN" | "DZ"; local: string } | null => {
  const tn = digits.match(/^(?:00)?216(\d{8})$/);
  if (tn) return { country: "TN", local: tn[1] };
  const dz = digits.match(/^(?:00)?2130?(\d{8,9})$/);
  if (dz) return { country: "DZ", local: `0${dz[1]}` };
  return null;
};

const formatLocal = (digits: string, country: "TN" | "DZ"): string => {
  if (!digits) return "";
  if (country === "TN") {
    return groupDigits(digits.slice(0, sum(TN_GROUPS)), TN_GROUPS);
  }
  const local = digits.startsWith("0") ? digits : `0${digits}`;
  const groups = dzGroups(local);
  return groupDigits(local.slice(0, sum(groups)), groups);
};

/**
 * Country of a stored or typed number: "OT" once it is longer than any
 * Tunisian or Algerian shape (so it is left alone rather than mangled), or
 * null while it has no digits at all.
 */
export const detectPhoneCountry = (value?: string | null): PhoneCountry | null => {
  const digits = phoneDigits(value);
  if (!digits) return null;
  const international = parseInternational(digits);
  if (international) return international.country;
  if (digits.startsWith("0")) return digits.length <= DZ_MAX_LEN ? "DZ" : "OT";
  return digits.length <= TN_LEN ? "TN" : "OT";
};

/** Formats a phone field as the user types, in the selected country's format. */
export const formatPhoneInput = (value: string, country: PhoneCountry): string => {
  // "Autre" : typed exactly as given, nothing enforced but the column length.
  if (country === "OT") return value.slice(0, FREE_MAX_LEN);

  const digits = phoneDigits(value);
  const international = parseInternational(digits);
  if (international) return formatLocal(international.local, international.country);

  // A leading 0 can only be Algerian: switch format instead of swallowing digits.
  const asCountry = digits.startsWith("0") ? "DZ" : country;
  const maxLen = asCountry === "TN" ? TN_LEN : DZ_MAX_LEN;
  // Longer than either shape: this isn't a Tunisian or Algerian number after
  // all, so stop reshaping it — truncating here would just eat digits.
  return digits.length > maxLen ? digits : formatLocal(digits, asCountry);
};

/** Re-formats an existing number after the user picked another country. */
export const convertPhoneCountry = (
  value: string | null | undefined,
  country: PhoneCountry
): string => {
  if (country === "OT") return (value || "").slice(0, FREE_MAX_LEN);
  const digits = phoneDigits(value);
  const local = parseInternational(digits)?.local ?? digits;
  return formatLocal(country === "TN" ? local.replace(/^0+/, "") : local, country);
};

/**
 * Formats a search box without ever truncating, so a Tunisian or an Algerian
 * number can be typed in full. Text that is not a phone number is left untouched.
 */
export const formatPhoneSearch = (value: string): string => {
  if (!/^[\d\s+().-]*$/.test(value)) return value;
  const digits = phoneDigits(value);
  const international = parseInternational(digits);
  if (international) return formatLocal(international.local, international.country);
  const country = digits.startsWith("0") ? "DZ" : "TN";
  const localLength = country === "TN" ? sum(TN_GROUPS) : sum(dzGroups(digits));
  // Longer than a local number (e.g. "+216…" still being typed): keep every digit.
  return digits.length > localLength ? digits : formatLocal(digits, country);
};

/** Formats a stored number for display; anything unrecognised is shown as stored. */
export const formatPhoneDisplay = (phone?: string | null, fallback = "N/A"): string => {
  if (!phone) return fallback;
  const digits = phoneDigits(phone);
  const international = parseInternational(digits);
  const local = international?.local ?? digits;
  const country = international?.country ?? (local.startsWith("0") ? "DZ" : "TN");
  const expectedLength = country === "TN" ? sum(TN_GROUPS) : sum(dzGroups(local));
  return local.length === expectedLength ? formatLocal(local, country) : phone;
};
