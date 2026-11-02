"use server";

import { redirect } from "next/navigation";
import {
  authClient,
  bearer,
  clearSessionCookie,
  getUserFromToken,
  safeRedirect,
  setSessionCookie,
  syncUser,
  SESSION_COOKIE,
} from "@/lib/auth";
import { cookies } from "next/headers";

export type AuthFormState = {
  error?: string;
  notice?: string;
  values?: { name?: string; email?: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email").toLowerCase();
  const password = formData.get("password")?.toString() ?? "";
  const values = { email };

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", values };
  if (!password) return { error: "Enter your password.", values };

  const { data, error } = await authClient.signIn.email({ email, password });
  if (error || !data?.token) {
    return { error: error?.message ?? "Unable to sign in. Please try again.", values };
  }

  await setSessionCookie(data.token);
  await syncUser(data.user);
  redirect(safeRedirect(formData.get("next")));
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = formData.get("password")?.toString() ?? "";
  const values = { name, email };

  if (name.length < 2) return { error: "Enter your full name.", values };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", values };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", values };

  const { data, error } = await authClient.signUp.email({ name, email, password });
  if (error || !data) {
    return { error: error?.message ?? "Unable to create your account. Please try again.", values };
  }

  await syncUser(data.user);

  // No token means the project requires email verification before sign-in.
  if (!data.token) {
    return {
      notice: `We sent a verification link to ${email}. Open it to activate your account, then sign in.`,
      values,
    };
  }

  await setSessionCookie(data.token);
  redirect(safeRedirect(formData.get("next")));
}

// Called by the OAuth callback page with the token from the URL fragment.
export async function completeSocialSignIn(
  token: string,
  next?: string,
): Promise<{ error: string } | { redirectTo: string }> {
  const user = token ? await getUserFromToken(token) : null;
  if (!user) return { error: "We couldn't complete sign-in. Please try again." };

  await setSessionCookie(token);
  await syncUser(user);
  return { redirectTo: safeRedirect(next) };
}

export async function signOutAction() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await authClient.signOut({ fetchOptions: bearer(token) }).catch(() => {});
  await clearSessionCookie();
  redirect("/sign-in");
}
