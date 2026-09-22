import type { Lang } from '../api/types';

const IST_OFFSET_MS = 330 * 60 * 1000;
const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
};

/** Deterministic IST wall-clock parts, independent of the device's timezone or Intl support. */
function istParts(iso: string | number) {
  const ms = typeof iso === 'number' ? iso : Date.parse(iso);
  const d = new Date(ms + IST_OFFSET_MS);
  return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "10 Aug 26" */
export function formatDate(iso: string, lang: Lang = 'en'): string {
  const p = istParts(iso);
  return `${p.day} ${MONTHS[lang][p.month]} ${pad(p.year % 100)}`;
}

/** "11:50 PM" */
export function formatTime(iso: string): string {
  const { hours, minutes } = istParts(iso);
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(h12)}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** Indian digit grouping: 1500 -> "1,500", 1250000 -> "12,50,000" */
export function groupIndian(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** "₹ 1,500" (with the space, as in the design) */
export function formatINR(n: number): string {
  return `₹ ${groupIndian(n)}`;
}

export interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export function countdownParts(remainingMs: number): CountdownParts {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    days: pad(Math.floor(total / 86400)),
    hours: pad(Math.floor((total % 86400) / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
  };
}

/** "01d : 06h : 28m : 32s" */
export function formatCountdown(remainingMs: number): string {
  const p = countdownParts(remainingMs);
  return `${p.days}d : ${p.hours}h : ${p.minutes}m : ${p.seconds}s`;
}

/** "07:32" - used for the payment hold timer */
export function formatMinSec(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
