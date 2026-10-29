/**
 * Montant en toutes lettres, en dinars et millimes (3 décimales), pour les PDF :
 *   47.6     → "Quarante-sept dinars six cents millimes uniquement"
 *   1280.050 → "Mille deux cent quatre-vingts dinars cinquante millimes uniquement"
 */

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

// 0–99. `final`: nothing follows, so 80 is written "quatre-vingts"
const belowHundred = (n: number, final: boolean): string => {
  if (n < 20) return UNITS[n];
  const ten = Math.floor(n / 10);
  // 70–79 and 90–99 are built on 60 and 80: soixante-dix, quatre-vingt-onze…
  const unit = n % 10 + (ten === 7 || ten === 9 ? 10 : 0);
  if (unit === 0) return ten === 8 && final ? "quatre-vingts" : TENS[ten];
  if ((unit === 1 || unit === 11) && ten !== 8 && ten !== 9) return `${TENS[ten]}-et-${UNITS[unit]}`;
  return `${TENS[ten]}-${UNITS[unit]}`;
};

// 1–999. `final`: nothing follows, so "deux cents" / "quatre-vingts" take their "s"
const belowThousand = (n: number, final: boolean): string => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const words: string[] = [];
  if (hundreds > 0) {
    words.push(hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 && final ? "s" : ""}`);
  }
  if (rest > 0) words.push(belowHundred(rest, final));
  return words.join(" ");
};

/** Whole number in French words: 2280 → "deux mille deux cent quatre-vingts" */
export const nombreEnLettres = (n: number): string => {
  n = Math.floor(Math.abs(n));
  if (n === 0) return UNITS[0];
  const billions = Math.floor(n / 1e9);
  const millions = Math.floor((n % 1e9) / 1e6);
  const thousands = Math.floor((n % 1e6) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  // milliard / million are nouns: "deux cents millions"; mille is not: "deux cent mille"
  if (billions) parts.push(`${belowThousand(billions, true)} milliard${billions > 1 ? "s" : ""}`);
  if (millions) parts.push(`${belowThousand(millions, true)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${belowThousand(thousands, false)} mille`);
  if (rest) parts.push(belowThousand(rest, true));
  return parts.join(" ");
};

export const montantEnLettres = (amount: number): string => {
  const totalMillimes = Math.round(Math.abs(Number(amount) || 0) * 1000);
  const dinars = Math.floor(totalMillimes / 1000);
  const millimes = totalMillimes % 1000;
  // "un million de dinars", but "un million cent dinars"
  const de = dinars >= 1e6 && dinars % 1e6 === 0 ? "de " : "";
  const words =
    `${nombreEnLettres(dinars)} ${de}${dinars > 1 ? "dinars" : "dinar"} ` +
    `${nombreEnLettres(millimes)} ${millimes > 1 ? "millimes" : "millime"}`;
  return words.charAt(0).toUpperCase() + words.slice(1) + " uniquement";
};
