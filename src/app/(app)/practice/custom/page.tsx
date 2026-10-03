import { requireUser } from "@/lib/auth";
import { PracticeSetup, type PracticeQuery } from "@/components/practice-setup";

export default async function CustomPractice({
  searchParams,
}: {
  searchParams: Promise<PracticeQuery>;
}) {
  const user = await requireUser();
  return (
    <PracticeSetup
      userId={user.id}
      query={await searchParams}
      headingLevel={1}
    />
  );
}
