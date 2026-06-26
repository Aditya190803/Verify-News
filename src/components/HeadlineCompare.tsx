import type { ApiStory } from '@/services/aggregation/types';

const LEFT = new Set(['left', 'center-left']);
const RIGHT = new Set(['right', 'center-right']);

export function HeadlineCompare({ story }: { story: ApiStory }) {
  const left = story.articles.filter((a) => a.outlet && LEFT.has(a.outlet.biasLabel));
  const right = story.articles.filter((a) => a.outlet && RIGHT.has(a.outlet.biasLabel));
  if (!left.length && !right.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-3">
          Left & center-left
        </h3>
        <ul className="space-y-2 text-sm">
          {left.length ? (
            left.map((a) => (
              <li key={a.id}>
                <span className="font-medium text-foreground">{a.outlet?.name}</span>
                <p className="text-muted-foreground line-clamp-2 mt-0.5">{a.title}</p>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-xs">No left-leaning sources on this cluster yet.</li>
          )}
        </ul>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-3">
          Right & center-right
        </h3>
        <ul className="space-y-2 text-sm">
          {right.length ? (
            right.map((a) => (
              <li key={a.id}>
                <span className="font-medium text-foreground">{a.outlet?.name}</span>
                <p className="text-muted-foreground line-clamp-2 mt-0.5">{a.title}</p>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-xs">No right-leaning sources on this cluster yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}