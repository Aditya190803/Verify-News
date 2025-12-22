/**
 * Stack Auth Client Configuration for Vite/React
 * 
 * This file initializes the Stack Auth client app using the official JS SDK
 * which properly handles OAuth flows including Google sign-in.
 */

import { StackClientApp } from "@stackframe/js";

// Check if Stack Auth is configured
const isConfigured = Boolean(
  import.meta.env.VITE_STACK_PROJECT_ID && 
  import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY
);

// Create the Stack Auth client app
export const stackClientApp = isConfigured 
  ? new StackClientApp({
      projectId: import.meta.env.VITE_STACK_PROJECT_ID,
      publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
      tokenStore: "cookie",
      urls: {
        oauthCallback: window.location.origin + "/oauth/callback",
      },
    })
  : null;

/**
 * Check if Stack Auth is properly configured
 */
export const isStackAuthConfigured = (): boolean => {
  return isConfigured && stackClientApp !== null;
};
