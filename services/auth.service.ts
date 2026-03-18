import { supabase } from "@/supabaseconfig";

// ─── Sign In ──────────────────────────────────────────────────────────────────
export interface SignInResult {
  uid: string | null;
  emailNotConfirmed: boolean;
  error: string | null;
}

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { uid: null, emailNotConfirmed: true, error: null };
    }
    return { uid: null, emailNotConfirmed: false, error: error.message };
  }

  return {
    uid: data.session?.user.id ?? null,
    emailNotConfirmed: false,
    error: null,
  };
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export interface SignUpResult {
  alreadyRegistered: boolean;
  error: string | null;
}

export async function signUp(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { alreadyRegistered: false, error: error.message };
  }

  if (data.user?.identities?.length === 0) {
    return { alreadyRegistered: true, error: null };
  }

  return { alreadyRegistered: false, error: null };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export interface VerifyOtpResult {
  success: boolean;
  uid: string | null;
  error: string | null;
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { success: false, uid: null, error: error.message };
  }

  return {
    success: !!data.session,
    uid: data.session?.user.id ?? null,
    error: null,
  };
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export async function resendOtp(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return { error: error?.message ?? null };
}

// ─── Get current session ──────────────────────────────────────────────────────
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
}
