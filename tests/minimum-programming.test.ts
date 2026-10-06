import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadContent } from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";

// Semantic review oracle: choices are justified by object bounds, string contracts
// and stdio return-value contracts. Undefined behavior is classified, not executed.
const reviewedChoices: Record<string, string> = {
  "variables-min10-03": "int count = 0;",
  "variables-min10-06":
    "Объект limit нельзя изменять присваиванием через это имя",
  "variables-min10-08": "Нет: время жизни x закончилось при выходе из функции",
  "variables-min10-09":
    "0: беззнаковая арифметика выполняется по модулю UINT_MAX+1",
  "operators-min10-08":
    "Нет: две модификации i не упорядочены, это undefined behavior",
  "operators-min10-09": "0 < x && x < 10",
  "c-bitwise-min10-07": "x является степенью двойки",
  "c-bitwise-min10-08": "Undefined behavior: величина сдвига равна ширине типа",
  "c-bitwise-min10-09": "(f & mask) == mask",
  "arrays-min10-04": "i < 5",
  "arrays-min10-07":
    "Нет: чтение a[3] выходит за массив и имеет undefined behavior",
  "arrays-min10-09": "max=a[0]; затем проверить индексы от 1 до n-1",
  "strings-min10-01": "'\\0'",
  "strings-min10-05": "Последовательности символов строк совпадают",
  "strings-min10-07": "Undefined behavior: изменяется строковый литерал",
  "strings-min10-08": "Нет: внутри массива нет нулевого терминатора",
  "files-min10-01": "a",
  "files-min10-02": "f != NULL",
  "files-min10-03": "1",
  "files-min10-04":
    "Нужно различать все значения unsigned char и отдельное значение EOF",
  "files-min10-05": "while ((ch = fgetc(f)) != EOF)",
  "files-min10-07":
    "Перемещает позицию в начало и очищает индикаторы EOF и ошибки",
  "files-min10-08":
    "Нет: ошибка могла возникнуть при сбросе буфера во время fclose",
  "files-min10-09":
    "fscanf вернёт 0, буква останется; возможен бесконечный цикл со старым x",
  "pointers-min10-04": "p=&b;",
  "pointers-min10-05":
    "Первое безопасно и даёт 1; второе разыменовывает NULL и имеет undefined behavior",
  "pointers-arrays-min10-01": "p=b;",
  "pointers-arrays-min10-04": "int (*m)[3]",
  "pointers-arrays-min10-06":
    "Типы int* и int (*)[4]; шаг +1 означает один int и целый массив соответственно",
  "pointers-arrays-min10-08":
    "От a+2 осталось только пять элементов; n должен описывать доступный диапазон от переданного адреса",
  "structs-min10-05": "a.x==b.x && a.y==b.y",
  "structs-min10-08":
    "Нет: padding может отличаться; сравнивать смысловые поля следует отдельно",
  "structs-min10-09":
    "На a: копируется адрес, а внутренние ссылки автоматически не перенастраиваются",
  "malloc-min10-01": "malloc(n * sizeof *p)",
  "malloc-min10-02":
    "Нет: malloc не инициализирует содержимое; чтение не даёт гарантированного значения и может иметь undefined behavior",
  "malloc-min10-04": "Не выполняет никаких действий",
  "malloc-min10-06":
    "При неудаче исходный блок остаётся выделенным; временный указатель сохраняет адрес для дальнейшей работы или free",
  "malloc-min10-07":
    "Нет: освобождение завершило жизнь блока, а p=NULL не исправляет другие указатели",
  "malloc-min10-08": "n <= SIZE_MAX / sizeof *p",
  "malloc-min10-09":
    "free(base); после этого не использовать middle для доступа к блоку",
  "function-pointers-min10-01": "int (*op)(int,int);",
  "function-pointers-min10-05":
    "Нет: вызов через несовместимый тип функции имеет undefined behavior, приведение не исправляет сигнатуру",
  "function-pointers-min10-06":
    "find — функция с параметром int, возвращающая int*",
  "function-pointers-min10-09": "return (x>y)-(x<y);",
};

test("minimum programming batch: every answer has an independent reviewed or compiled oracle", async () => {
  const { questions } = await loadContent();
  const batch = questions.filter(
    (q) =>
      q.id.includes("-min10-") &&
      [
        "arrays",
        "strings",
        "files",
        "variables",
        "operators",
        "c-bitwise",
        "pointers-arrays",
        "pointers",
        "structs",
        "malloc",
        "function-pointers",
      ].includes(q.topicId),
  );
  const directory = mkdtempSync(join(tmpdir(), "studyspace-minimum-c-"));
  try {
    const executable = join(directory, "traces");
    const compiled = spawnSync(
      "cc",
      [
        "-std=c11",
        "-Wall",
        "-Wextra",
        "-Werror",
        "tests/fixtures/minimum-programming.c",
        "-o",
        executable,
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(
      compiled.status,
      0,
      compiled.stderr || compiled.error?.message,
    );
    const result = spawnSync(executable, [], {
      encoding: "utf8",
      timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr);
    const observed: Record<string, string> = { ...reviewedChoices };
    for (const line of result.stdout.trim().split("\n")) {
      const [id, value] = line.split("|");
      assert.ok(!(id in observed), `Duplicate oracle ${id}`);
      observed[id] = value;
    }
    assert.equal(Object.keys(observed).length, batch.length);
    for (const question of batch) {
      assert.ok(question.id in observed, `Missing validation ${question.id}`);
      assert.ok(
        checkAnswer(question.type, question.answer, observed[question.id]),
        question.id,
      );
      if (question.type === "MULTIPLE_CHOICE") {
        assert.equal(
          question.options.filter((option) =>
            checkAnswer(question.type, question.answer, option),
          ).length,
          1,
          question.id,
        );
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
