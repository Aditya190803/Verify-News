import type { Appearance } from '@clerk/types';

/** Embedded inside the Facets auth card — no duplicate Clerk chrome. */
export const facetsAuthClerkAppearance: Appearance = {
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'shadow-none border-0 bg-transparent p-0 w-full',
    header: '!hidden',
    headerTitle: '!hidden',
    headerSubtitle: '!hidden',
    logoBox: '!hidden',
    logoImage: '!hidden',
  },
};