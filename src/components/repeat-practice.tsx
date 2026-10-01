"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function RepeatPractice({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const key = useRef<string | null>(null);
  async function repeat() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "repeat",
          sessionId,
          requestKey: key.current,
        }),
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok || typeof data.sessionId !== "string")
        throw new Error(data.error || "Не удалось повторить практику.");
      router.push(`/practice/${data.sessionId}`);
    } catch (cause) {
      inFlight.current = false;
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Ошибка сети.");
    }
  }
  return (
    <div>
      <button type="button" className="button" disabled={busy} onClick={repeat}>
        <RotateCcw size={16} />
        {busy ? "Готовим задания…" : "Практиковаться снова"}
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
