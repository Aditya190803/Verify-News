/** Start of current calendar month (local), ms since epoch. */
export function monthStartMs() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}