import { Skeleton } from '@/components/ui/skeleton';

type AuthFormSkeletonProps = {
  mode?: 'sign-in' | 'sign-up';
};

/** Form placeholder while Clerk hydrates (header is shown separately). */
export function AuthFormSkeleton({ mode = 'sign-in' }: AuthFormSkeletonProps) {
  const fieldCount = 2;

  return (
    <div
      className="space-y-4 pt-5"
      aria-busy="true"
      aria-label={mode === 'sign-up' ? 'Loading sign up' : 'Loading sign in'}
    >
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="flex justify-center pt-1">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}