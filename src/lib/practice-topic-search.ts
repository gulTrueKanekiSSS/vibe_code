// Search changes the visible list only, never the selected practice scope.
function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ru").replaceAll("ё", "е");
}

export function matchesTopicSearch(
  topic: { id: string; title: string },
  subjectTitle: string,
  query: string,
) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const text = normalize(
    `${topic.title} ${topic.id.replaceAll("-", " ")} ${subjectTitle}`,
  );
  return words.every((word) => text.includes(word));
}
