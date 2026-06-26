import type { Appearance } from '@clerk/types';

/** Embed Clerk inside Facets cards — tokens come from shadcn theme + CSS variables. */
export const facetsClerkAppearance: Appearance = {
  elements: {
    rootBox: 'w-full mx-auto',
    cardBox: 'w-full shadow-none',
    card: 'shadow-none border-0 bg-transparent p-0 gap-3 w-full',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'border border-input bg-background hover:bg-muted/50 transition-colors h-10 text-sm font-medium',
    socialButtonsBlockButtonText: 'text-foreground font-medium',
    formButtonPrimary: 'h-10 text-sm font-medium shadow-none',
    formFieldInput: 'h-10 text-sm',
    formFieldLabel: 'text-sm font-medium text-foreground',
    footerActionLink: 'text-primary font-medium hover:underline underline-offset-4',
    identityPreviewEditButton: 'text-primary',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground text-xs',
    footer: 'bg-transparent',
    footerActionText: 'text-muted-foreground text-sm',
    formFieldInputShowPasswordButton: 'text-muted-foreground',
    otpCodeFieldInput: 'border-input',
    formResendCodeLink: 'text-primary',
    alert: 'rounded-lg border border-border bg-muted/30',
  },
  layout: {
    socialButtonsPlacement: 'top',
    showOptionalFields: true,
  },
};

export const facetsClerkAppearanceEmbedded: Appearance = {
  ...facetsClerkAppearance,
  elements: {
    ...facetsClerkAppearance.elements,
    card: 'shadow-none border-0 bg-transparent px-0 py-2 sm:px-2 w-full',
  },
};