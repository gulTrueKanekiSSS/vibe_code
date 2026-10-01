import curriculum from "../../content/curriculum.json";

export const automaticTopicIds = [
  ...curriculum.confirmed,
  ...curriculum.existingCompatible,
];
export function curriculumLabel(topicId: string) {
  if (curriculum.confirmed.includes(topicId)) return "В программе курса";
  if (curriculum.existingCompatible.includes(topicId))
    return "Ранее добавленная тема";
  if (curriculum.future.includes(topicId)) return "На будущее";
  return "Дополнительный материал";
}
