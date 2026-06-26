import type { Appearance } from '@clerk/types';
import { facetsClerkAppearanceEmbedded } from '@/lib/clerkAppearance';

/** Sign-up uses the same rhythm as sign-in; only feedback text is tuned. */
export const facetsClerkSignUpAppearance: Appearance = {
  ...facetsClerkAppearanceEmbedded,
  elements: {
    ...facetsClerkAppearanceEmbedded.elements,
    formFieldSuccessText: 'text-xs text-emerald-700 dark:text-emerald-400 mt-1',
    formFieldErrorText: 'text-xs text-destructive mt-1',
    formFieldInfoText: 'text-xs text-muted-foreground',
  },
};