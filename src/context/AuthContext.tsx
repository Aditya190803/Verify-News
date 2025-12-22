
/* eslint-disable react-refresh/only-export-components */

// This file is a compatibility wrapper that re-exports the Stack Auth implementation.
// The project uses many imports like `@/context/AuthContext`; to switch the app to
// Stack Auth without changing those imports, we re-export the provider and hook
// from `AuthContext.stack.tsx`.

export { AuthProvider, useAuth } from './AuthContext.stack';
