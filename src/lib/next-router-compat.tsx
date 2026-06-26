'use client';

import NextLink from 'next/link';
import {
  useRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
  usePathname,
} from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

/** react-router useLocation shim */
export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: '', hash: '', state: null, key: 'default' };
}

export function useNavigate() {
  const router = useRouter();
  return (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useParams<T extends Record<string, string | undefined>>() {
  return useNextParams() as T;
}

/** Rough react-router useSearchParams tuple for Pricing etc. */
export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const params = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sp = new URLSearchParams(params?.toString() ?? '');
  const set = (next: URLSearchParams) => {
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };
  return [sp, set];
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  );
}