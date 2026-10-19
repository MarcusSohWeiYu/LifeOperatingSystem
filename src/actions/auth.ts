"use server";

import { cookies } from "next/headers";
import { createSessionToken } from "@/lib/session";

export async function login(
  passcode: string,
): Promise<{ ok: true } | { error: string }> {
  const expected = process.env.PASSCODE;
  const secret = process.env.SESSION_SECRET;

  if (!expected || !secret) {
    return { ok: true };
  }

  if (passcode !== expected) {
    return { error: "Incorrect passcode. Try again." };
  }

  const token = await createSessionToken(secret);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { ok: true };
}
