import type { Appearance } from '@clerk/types';
import { shadcn } from '@clerk/ui/themes';

/**
 * Clerk UI ownership (read this before editing auth screens):
 *
 * - Clerk Dashboard → fields, OAuth providers, sign-up requirements
 * - facetsClerkAppearance → global theme (ClerkProvider) for all Clerk widgets
 * - facetsAuthEmbedAppearance → embedded /sign-in and /sign-up only
 * - AuthWelcomeHeader + AuthPageLayout → Facets shell (logo, titles, page chrome)
 *
 * Do not style Clerk with ad-hoc Tailwind on random elements — use appearance below.
 */
export const facetsClerkAppearance: Appearance = {
  theme: shadcn,
};

/** Flush embed: no nested Clerk card; Facets card owns the chrome. */
export const facetsAuthEmbedAppearance: Appearance = {
  theme: shadcn,
  options: {
    elevation: 'flush',
    showOptionalFields: false,
    socialButtonsVariant: 'blockButton',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none border-0 bg-transparent overflow-visible',
    card: 'w-full bg-transparent shadow-none border-0 p-0 gap-4',
    main: 'gap-4',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    socialButtonsRoot: 'w-full gap-3',
    socialButtons: 'w-full',
    socialButtonsBlockButton: 'w-full',
    dividerRow: 'gap-3 my-2',
    dividerText: 'text-xs text-muted-foreground',
    formFieldLabel: 'text-sm font-medium text-foreground',
    formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground',
    footerPages: 'hidden',
    footer: 'bg-transparent border-0 shadow-none pt-1',
    footerAction: 'pt-2',
    formButtonPrimary: 'w-full normal-case font-medium',
  },
};