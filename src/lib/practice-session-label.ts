export function practiceSessionLabel(mode: string): string {
  return (
    (
      {
        daily: "Практика дня",
        quick: "Быстрая практика",
        weak: "Слабые темы",
        exam: "Экзамен",
        custom: "Своя практика",
        topic: "Практика по теме",
        subject: "Практика по предмету",
      } as Record<string, string>
    )[mode] ?? "Практика"
  );
}
export function protectedPracticeSession(
  mode: string,
  config: unknown,
): boolean {
  const value = config as {
    feedbackMode?: string;
    hintsAllowed?: boolean;
  } | null;
  return (
    mode === "exam" ||
    value?.feedbackMode === "end" ||
    value?.hintsAllowed === false
  );
}
