export type TutorContextInput = {
  topicId?: string;
  sectionIndex?: number;
  practiceItemId?: string;
};
export type TutorContext = {
  subjectTitle: string;
  moduleTitle: string;
  topicTitle: string;
  topicId: string;
  sectionTitle?: string;
  practiceItemId?: string;
  restricted: boolean;
};
export type TutorSource = {
  id: string;
  title: string;
  topicId: string;
  sectionTitle: string;
  sectionIndex: number;
  url: string;
  page?: number | null;
};
export type RetrievedChunk = TutorSource & {
  text: string;
  retrieval: "semantic" | "lexical";
};
export type TutorMessageView = {
  id: string;
  requestKey?: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "complete" | "failed";
  sources: TutorSource[];
};
export type TutorSnapshot = {
  context: TutorContext;
  conversationId: string | null;
  messages: TutorMessageView[];
  available: boolean;
  unavailableReason?: string;
  blockingSession?: { id: string; mode: string; createdAt: string };
};
export type TutorHistoryEntry = { role: "user" | "assistant"; content: string };
export type TutorExercise = {
  prompt: string;
  type?: string;
  options?: string[];
  difficulty: string;
  studentAnswer?: string | string[] | null;
  attemptCount: number;
  hintsUsed: string[];
  solution?: string;
};
export type TutorGenerationInput = {
  context: TutorContext;
  exercise?: TutorExercise;
  history: TutorHistoryEntry[];
  message: string;
  sources: RetrievedChunk[];
};
export type TutorModelResponse =
  | {
      kind: "guided";
      action: "first-step" | "simpler" | "hint" | "why" | "check";
    }
  | {
      kind: "teaching";
      message: string;
      citationIds: string[];
      grounding: "course" | "general" | "insufficient";
    };
export interface TutorProvider {
  readonly embeddingModel: string;
  embedText(texts: string[]): Promise<number[][]>;
  generateTutorResponse(
    input: TutorGenerationInput,
  ): Promise<TutorModelResponse>;
}
