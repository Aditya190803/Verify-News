const STOP = new Set(
  'a an the and or but in on at to for of is are was were be been being with from as by it its this that these those not says said will can could would about into over after before during amid'.split(
    ' ',
  ),
);

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleTokens(title: string): Set<string> {
  const tokens = new Set<string>();
  for (const w of normalizeTitle(title).split(' ')) {
    if (w.length > 2 && !STOP.has(w)) tokens.add(w);
  }
  return tokens;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function titlesMatch(
  a: string,
  b: string,
  publishedA?: number | null,
  publishedB?: number | null,
): boolean {
  if (jaccard(titleTokens(a), titleTokens(b)) < 0.35) return false;
  if (!publishedA || !publishedB) return true;
  const dayMs = 86_400_000;
  return Math.abs(publishedA - publishedB) <= dayMs;
}