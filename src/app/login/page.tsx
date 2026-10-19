"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function submit(currentDigits: string[]) {
    const passcode = currentDigits.join("");
    if (passcode.length < 6) return;
    startTransition(async () => {
      const result = await login(passcode);
      if ("ok" in result) {
        router.replace("/");
      } else {
        setError(result.error);
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    });
  }

  function handleChange(value: string, index: number) {
    if (!/^\d?$/.test(value)) return;
    setError(null);
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.filter(Boolean).length === 6) {
      submit(next);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    text.split("").forEach((c, i) => {
      next[i] = c;
    });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) {
      submit(next);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-xs mx-auto px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Life OS</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your 6-digit passcode
        </p>

        <div className="flex gap-2 justify-center mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[i]}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              disabled={isPending}
              autoFocus={i === 0}
              className={cn(
                "w-11 h-14 text-center text-xl font-mono rounded-lg border bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                "disabled:opacity-40",
                error ? "border-destructive" : "border-input",
              )}
            />
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {isPending && (
          <p className="text-sm text-muted-foreground">Verifying…</p>
        )}
      </div>
    </main>
  );
}
