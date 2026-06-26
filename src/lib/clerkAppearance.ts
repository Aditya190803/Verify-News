import type { Appearance } from '@clerk/types';

/** Match LoginForm / SignupForm: h-11, rounded-lg, email-first, Google last. */
export const facetsClerkAppearanceEmbedded: Appearance = {
  variables: {
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'shadow-none border-0 bg-transparent p-0 gap-6 w-full',
    header: '!hidden',
    headerTitle: '!hidden',
    headerSubtitle: '!hidden',
    logoBox: '!hidden',
    logoImage: '!hidden',
    main: 'gap-6',
    form: 'gap-6',
    formFieldRow: 'gap-2',
    formFieldLabelRow: 'w-full gap-2',
    formFieldLabel: 'text-sm font-medium text-foreground',
    formFieldHintText: 'text-xs text-muted-foreground',
    phoneInputBox: 'clerk-facets-phone',
    formFieldInputGroup: 'clerk-facets-input-group',
    formButtonPrimary:
      'w-full h-11 rounded-lg text-sm font-medium shadow-none bg-primary text-primary-foreground hover:bg-primary/90',
    formFieldAction: 'text-xs text-muted-foreground hover:text-foreground transition-colors',
    formFieldAction__forgotPassword: 'text-xs text-muted-foreground hover:text-foreground',
    socialButtons: 'gap-3 w-full',
    socialButtonsBlockButton: 'clerk-facets-oauth',
    socialButtonsBlockButtonText: 'text-foreground font-medium',
    dividerRow: 'py-2 w-full',
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground text-xs uppercase tracking-wide',
    footer: '!hidden',
    footerAction: '!hidden',
    footerActionText: '!hidden',
    footerActionLink: '!hidden',
    identityPreviewEditButton: 'text-primary text-sm',
    formFieldInputShowPasswordButton: 'text-muted-foreground',
    otpCodeFieldInput: 'rounded-lg border-input h-11',
    formResendCodeLink: 'text-primary text-sm',
    alert: 'rounded-lg border border-border bg-muted/30 text-sm',
    alternativeMethodsBlockButton: 'h-11 rounded-lg border border-input',
  },
  options: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
    showOptionalFields: true,
  },
};

export const facetsClerkAppearance: Appearance = facetsClerkAppearanceEmbedded;