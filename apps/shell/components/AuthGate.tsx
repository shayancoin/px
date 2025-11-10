"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type RenderFallbackArgs = {
  signIn: () => Promise<void>;
  error: string | null;
  loading: boolean;
};

type Fallback = ReactNode | ((args: RenderFallbackArgs) => ReactNode);

type AuthGateProps = {
  children: ReactNode;
  fallback?: Fallback;
  loadingFallback?: ReactNode | (() => ReactNode);
};

const renderDefaultFallback = ({ signIn, error }: RenderFallbackArgs) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-center text-white">
    <div className="flex max-w-md flex-col items-center gap-3">
      <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
        Kitchen-X
      </span>
      <h1 className="text-3xl font-semibold">Sign in to configure your kitchen</h1>
      <p className="text-sm text-white/60">
        Use your Google account to access saved layouts, design variants, and checkout sessions.
      </p>
    </div>
    <button
      type="button"
      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
      onClick={() => signIn()}
    >
      Continue with Google
    </button>
    {error ? (
      <p className="text-xs text-red-300">Authentication error: {error}</p>
    ) : null}
  </div>
);

const renderDefaultLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
    <span className="animate-pulse text-sm uppercase tracking-[0.4em] text-white/60">
      Loading
    </span>
  </div>
);

export function AuthGate({
  children,
  fallback,
  loadingFallback,
}: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, getGoogleProvider());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setLoading(true);

    try {
      await signOut(getFirebaseAuth());
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signOut: handleSignOut,
      getIdToken: async (forceRefresh = false) => {
        if (!user) return null;
        return user.getIdToken(forceRefresh);
      },
    }),
    [user, loading, error],
  );

  if (loading) {
    const loadingNode =
      typeof loadingFallback === "function"
        ? loadingFallback()
        : loadingFallback ?? renderDefaultLoading();
    return <>{loadingNode}</>;
  }

  if (!user) {
    const fallbackNode =
      typeof fallback === "function"
        ? fallback({ signIn: signInWithGoogle, error, loading })
        : fallback ?? renderDefaultFallback({ signIn: signInWithGoogle, error, loading });

    return (
      <>
        {fallbackNode}
        {error ? (
          <div className="fixed inset-x-0 bottom-6 flex justify-center">
            <span className="rounded-full bg-red-600/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {error}
            </span>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthGate component.");
  }
  return context;
}

