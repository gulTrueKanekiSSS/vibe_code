import { resolve } from "node:path";
import { validateContentDirectory } from "./content-validation";

validateContentDirectory(resolve("content")).then(
  ({ subjects, lessons, questions }) => {
    console.log(
      `Content valid: ${subjects.length} subjects, ${lessons.length} lessons, ${questions.length} questions. No database accessed.`,
    );
  },
  (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Content validation failed",
    );
    process.exitCode = 1;
  },
);
