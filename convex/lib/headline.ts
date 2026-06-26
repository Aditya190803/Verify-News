const LIFESTYLE =
  /amazon|wayfair|way day|mother's day|composting|high-yield savings|best deals|shop this week|taxes are due|hair dryer|aluminum foil|travel products|dress this spring|bidets save/i;

export function cleanHeadline(title: string): string {
  return title
    .replace(/^(opinion|analysis|watch|podcast|exclusive|breaking):\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isLikelyNewsHeadline(title: string): boolean {
  const t = cleanHeadline(title);
  if (t.length < 12) return false;
  if (LIFESTYLE.test(t)) return false;
  return true;
}

/** Prefer shorter, neutral headlines when clustering (first article often has promos). */
export function pickCanonicalTitle(titles: string[]): string {
  const candidates = [...new Set(titles.map(cleanHeadline).filter(isLikelyNewsHeadline))];
  if (candidates.length === 0) return cleanHeadline(titles[0] ?? 'Story');

  return candidates.sort((a, b) => {
    const score = (s: string) => {
      let n = s.length;
      if (s.includes(':')) n += 15;
      if (/^\d/.test(s)) n += 5;
      return n;
    };
    return score(a) - score(b);
  })[0];
}