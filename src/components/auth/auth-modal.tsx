"use client";

import { FormEvent, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  nextPath?: string;
  onAuthSuccess?: () => void;
};

type AuthView = "sign-in" | "sign-up" | "forgot" | "reset";

export function AuthModal({ open, onClose, nextPath = "/reserve", onAuthSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [loading, onClose, open]);

  if (!open) return null;

  const isRecoveryMode = typeof window !== "undefined" && window.location.hash.includes("type=recovery");
  const activeView: AuthView = isRecoveryMode ? "reset" : view;

  const setMessage = (ok: boolean, message: string) => {
    setState({ ok, message });
  };

  const onGoogle = async () => {
    setLoading(true);
    setState(null);

    const supabase = createSupabaseBrowserClient();
    const callbackPath = `/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const redirectTo = `${window.location.origin}${callbackPath}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      setMessage(false, error.message);
    }
  };

  const onSubmitSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setState(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) {
      setMessage(false, error.message);
      return;
    }

    if (onAuthSuccess) {
      onAuthSuccess();
      onClose();
      return;
    }

    window.location.assign(nextPath);
  };

  const onSubmitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(null);

    if (name.trim().length < 2) {
      setMessage(false, "Name must be at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setMessage(false, "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(false, "Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}${nextPath}`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: name.trim(),
        },
      },
    });

    setLoading(false);
    if (error) {
      setMessage(false, error.message);
      return;
    }

    if (!data.session) {
      setMessage(true, "Account created. Verify from email, then sign in.");
      setView("sign-in");
      return;
    }

    if (onAuthSuccess) {
      onAuthSuccess();
      onClose();
      return;
    }

    window.location.assign(nextPath);
  };

  const onSubmitForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setState(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}${nextPath}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);
    if (error) {
      setMessage(false, error.message);
      return;
    }

    setMessage(true, "Password reset email sent. Please check your inbox.");
  };

  const onSubmitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(null);

    if (password.length < 8) {
      setMessage(false, "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(false, "Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(false, error.message);
      return;
    }

    window.history.replaceState({}, "", nextPath);
    setMessage(true, "Password updated successfully. You can sign in now.");
    setPassword("");
    setConfirmPassword("");
    setView("sign-in");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div className="flex h-full items-end sm:items-center sm:justify-center">
        <div
          className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-md sm:rounded-3xl sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="ui-eyebrow">Reservations</p>
              <h3 className="text-2xl text-[var(--foreground)]">Login or Sign Up</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ui-btn-secondary px-3 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              ["sign-in", "Sign In"],
              ["sign-up", "Sign Up"],
              ["forgot", "Forgot"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setView(value as AuthView);
                  setState(null);
                  setName("");
                  setPassword("");
                  setConfirmPassword("");
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  activeView === value ? "ui-btn-primary" : "ui-btn-secondary"
                }`}
                disabled={activeView === "reset"}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void onGoogle()}
            disabled={loading}
            className="ui-btn-primary w-full justify-center px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Continue with Google"}
          </button>

          <div className="my-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-[var(--border)]/50" />
            <span className="ui-eyebrow !tracking-[0.12em]">or email</span>
            <span className="h-px flex-1 bg-[var(--border)]/50" />
          </div>

          {activeView === "sign-in" ? (
            <form className="space-y-3" onSubmit={onSubmitSignIn}>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  className="ui-field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    className="ui-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="ui-btn-primary w-full justify-center px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : null}

          {activeView === "sign-up" ? (
            <form className="space-y-3" onSubmit={onSubmitSignUp}>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Name
                </span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                  className="ui-field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  className="ui-field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    className="ui-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Confirm Password
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    className="ui-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="ui-btn-primary w-full justify-center px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          ) : null}

          {activeView === "forgot" ? (
            <form className="space-y-3" onSubmit={onSubmitForgot}>
              <p className="ui-copy text-sm">
                Enter your account email and we will send a password reset link.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  className="ui-field"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="ui-btn-primary w-full justify-center px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : null}

          {activeView === "reset" ? (
            <form className="space-y-3" onSubmit={onSubmitReset}>
              <p className="ui-copy text-sm">
                Recovery session detected. Set a new password to complete account recovery.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  New Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    className="ui-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Confirm Password
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    className="ui-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="ui-btn-primary w-full justify-center px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          ) : null}

          {state ? (
            <p className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
