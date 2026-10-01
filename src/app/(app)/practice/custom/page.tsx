import { requireUser } from "@/lib/auth";
import { PageHeading } from "@/components/ui";
import { PracticeSetup, type PracticeQuery } from "@/components/practice-setup";

export default async function CustomPractice({
  searchParams,
}: {
  searchParams: Promise<PracticeQuery>;
}) {
  const user = await requireUser();
  return (
    <>
      <PageHeading
        title="Собрать практику"
        description="Выбери темы, сложность и содержание заданий."
      />
      <PracticeSetup userId={user.id} query={await searchParams} />
    </>
  );
}
