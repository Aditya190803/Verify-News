/** Lightweight entity hints from headlines (clustering aid). */
const INDIA_ENTITIES = [
  'modi',
  'bjp',
  'congress',
  'delhi',
  'mumbai',
  'kashmir',
  'parliament',
  'supreme court',
  'election',
  'lok sabha',
  'rahul',
  'gandhi',
  'india',
  'pakistan',
  'china',
  'rupee',
  'rbi',
];

export function extractEntityTokens(title: string): Set<string> {
  const norm = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = new Set(norm.split(/\s+/).filter((w) => w.length > 3));
  const entities = new Set<string>();
  for (const e of INDIA_ENTITIES) {
    if (norm.includes(e)) entities.add(e);
  }
  for (const w of words) {
    if (w.length > 5) entities.add(w);
  }
  return entities;
}

export function entityOverlap(a: string, b: string): number {
  const ea = extractEntityTokens(a);
  const eb = extractEntityTokens(b);
  if (ea.size === 0 && eb.size === 0) return 0;
  let inter = 0;
  for (const t of ea) if (eb.has(t)) inter++;
  const union = ea.size + eb.size - inter;
  return union === 0 ? 0 : inter / union;
}