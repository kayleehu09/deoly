export const TERMS_VERSION = 'draft-2026-11-08';
export const PRIVACY_NOTICE_VERSION = 'draft-2026-11-08';

export function normalizeDateOfBirth(value: string) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const today = new Date().toISOString().slice(0, 10);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    `${yearText}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}` > today
  ) {
    return null;
  }

  return `${yearText}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}`;
}

export function isAtLeast13(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  if (today.getUTCMonth() + 1 < month || (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)) age -= 1;
  return age >= 13;
}
