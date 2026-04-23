"use client";

const MAX_MODIFIER_DECIMAL_PLACES = 4;
const MODIFIER_INPUT_PATTERN = /^-?(?:\d+|\d*\.\d+)$/;

export type WeightedQuestionOptionDraft = {
  optionText: string;
  modifier: string;
  displayOrder: number;
};

export type WeightedQuestionDraft = {
  prompt: string;
  displayOrder: number;
  answerOptions: WeightedQuestionOptionDraft[];
};

type WeightedQuestionSource = {
  prompt: string;
  displayOrder?: number;
  answerOptions: Array<{
    optionText: string;
    modifier: string | number;
    displayOrder?: number;
  }>;
};

export function normalizeWeightedQuestionDrafts(
  questions: WeightedQuestionSource[] | undefined,
): WeightedQuestionDraft[] {
  return (questions ?? []).map((question, questionIndex) => ({
    prompt: question.prompt ?? "",
    displayOrder: questionIndex + 1,
    answerOptions: question.answerOptions.map((option, optionIndex) => ({
      optionText: option.optionText ?? "",
      modifier: String(option.modifier ?? "0"),
      displayOrder: optionIndex + 1,
    })),
  }));
}

function parseModifierInput(
  modifierValue: string,
  questionNumber: number,
  optionNumber: number,
) {
  const normalizedValue = modifierValue.trim();

  if (!normalizedValue || !MODIFIER_INPUT_PATTERN.test(normalizedValue)) {
    throw new Error(
      `Weighted question ${questionNumber} option ${optionNumber} must have a valid numeric modifier.`,
    );
  }

  const decimalPlaces = normalizedValue.split(".")[1]?.length ?? 0;

  if (decimalPlaces > MAX_MODIFIER_DECIMAL_PLACES) {
    throw new Error(
      `Weighted question ${questionNumber} option ${optionNumber} modifiers support at most ${MAX_MODIFIER_DECIMAL_PLACES} decimal places.`,
    );
  }

  const modifier = Number(normalizedValue);

  if (!Number.isFinite(modifier)) {
    throw new Error(
      `Weighted question ${questionNumber} option ${optionNumber} must have a valid numeric modifier.`,
    );
  }

  return modifier;
}

export function buildWeightedQuestionPayload(
  questions: WeightedQuestionDraft[],
) {
  return questions.map((question, questionIndex) => {
    const prompt = question.prompt.trim();

    if (!prompt) {
      throw new Error(
        `Weighted question ${questionIndex + 1} must have a prompt.`,
      );
    }

    if (question.answerOptions.length < 2) {
      throw new Error(
        `Weighted question ${questionIndex + 1} must have at least two answer options.`,
      );
    }

    return {
      prompt,
      displayOrder: questionIndex + 1,
      answerOptions: question.answerOptions.map((option, optionIndex) => {
        const optionText = option.optionText.trim();

        if (!optionText) {
          throw new Error(
            `Weighted question ${questionIndex + 1} has an empty answer option.`,
          );
        }

        return {
          optionText,
          modifier: parseModifierInput(
            String(option.modifier),
            questionIndex + 1,
            optionIndex + 1,
          ),
          displayOrder: optionIndex + 1,
        };
      }),
    };
  });
}

type Props = {
  value: WeightedQuestionDraft[];
  onChange: (questions: WeightedQuestionDraft[]) => void;
  disabled?: boolean;
};

export function WeightedQuestionsEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  function syncQuestionOrders(questions: WeightedQuestionDraft[]) {
    return questions.map((question, questionIndex) => ({
      ...question,
      displayOrder: questionIndex + 1,
      answerOptions: question.answerOptions.map((option, optionIndex) => ({
        ...option,
        displayOrder: optionIndex + 1,
      })),
    }));
  }

  function updateQuestions(nextQuestions: WeightedQuestionDraft[]) {
    onChange(syncQuestionOrders(nextQuestions));
  }

  function addQuestion() {
    updateQuestions([
      ...value,
      {
        prompt: "",
        displayOrder: value.length + 1,
        answerOptions: [
          { optionText: "", modifier: "0", displayOrder: 1 },
          { optionText: "", modifier: "0", displayOrder: 2 },
        ],
      },
    ]);
  }

  function removeQuestion(questionIndex: number) {
    updateQuestions(value.filter((_, index) => index !== questionIndex));
  }

  function moveQuestion(questionIndex: number, direction: -1 | 1) {
    const targetIndex = questionIndex + direction;

    if (targetIndex < 0 || targetIndex >= value.length) {
      return;
    }

    const nextQuestions = [...value];
    const [movedQuestion] = nextQuestions.splice(questionIndex, 1);
    nextQuestions.splice(targetIndex, 0, movedQuestion);
    updateQuestions(nextQuestions);
  }

  function updateQuestionPrompt(questionIndex: number, prompt: string) {
    updateQuestions(
      value.map((question, index) =>
        index === questionIndex ? { ...question, prompt } : question,
      ),
    );
  }

  function addAnswerOption(questionIndex: number) {
    updateQuestions(
      value.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answerOptions: [
                ...question.answerOptions,
                {
                  optionText: "",
                  modifier: "0",
                  displayOrder: question.answerOptions.length + 1,
                },
              ],
            }
          : question,
      ),
    );
  }

  function removeAnswerOption(questionIndex: number, optionIndex: number) {
    updateQuestions(
      value.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answerOptions: question.answerOptions.filter(
                (_, currentOptionIndex) => currentOptionIndex !== optionIndex,
              ),
            }
          : question,
      ),
    );
  }

  function moveAnswerOption(
    questionIndex: number,
    optionIndex: number,
    direction: -1 | 1,
  ) {
    updateQuestions(
      value.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const targetIndex = optionIndex + direction;

        if (
          targetIndex < 0 ||
          targetIndex >= question.answerOptions.length
        ) {
          return question;
        }

        const nextOptions = [...question.answerOptions];
        const [movedOption] = nextOptions.splice(optionIndex, 1);
        nextOptions.splice(targetIndex, 0, movedOption);

        return {
          ...question,
          answerOptions: nextOptions,
        };
      }),
    );
  }

  function updateAnswerOptionText(
    questionIndex: number,
    optionIndex: number,
    optionText: string,
  ) {
    updateQuestions(
      value.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answerOptions: question.answerOptions.map((option, currentIndex) =>
                currentIndex === optionIndex ? { ...option, optionText } : option,
              ),
            }
          : question,
      ),
    );
  }

  function updateAnswerOptionModifier(
    questionIndex: number,
    optionIndex: number,
    modifier: string,
  ) {
    updateQuestions(
      value.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answerOptions: question.answerOptions.map((option, currentIndex) =>
                currentIndex === optionIndex ? { ...option, modifier } : option,
              ),
            }
          : question,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600 ring-1 ring-slate-200">
        All configured weighted questions are required during specialized voting.
        Modifier values may be positive, negative, or zero and are applied on
        top of the existing specialized base weight before the final clamp. Use
        up to 4 decimal places per modifier.
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
          No weighted questions configured.
        </div>
      ) : (
        value.map((question, questionIndex) => (
          <div
            key={`weighted-question-${questionIndex}`}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Weighted question {questionIndex + 1}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Voters must select one answer option for this question.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveQuestion(questionIndex, -1)}
                  disabled={disabled || questionIndex === 0}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(questionIndex, 1)}
                  disabled={disabled || questionIndex === value.length - 1}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={disabled}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Remove question
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Question prompt
              </label>
              <textarea
                value={question.prompt}
                rows={3}
                disabled={disabled}
                onChange={(event) =>
                  updateQuestionPrompt(questionIndex, event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Answer options
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Each option contributes its modifier to the final specialized
                    weight.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => addAnswerOption(questionIndex)}
                  disabled={disabled}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                >
                  Add answer option
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {question.answerOptions.map((option, optionIndex) => (
                  <div
                    key={`weighted-question-${questionIndex}-option-${optionIndex}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Answer text
                        </label>
                        <input
                          type="text"
                          value={option.optionText}
                          disabled={disabled}
                          onChange={(event) =>
                            updateAnswerOptionText(
                              questionIndex,
                              optionIndex,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Modifier
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={option.modifier}
                          disabled={disabled}
                          onChange={(event) =>
                            updateAnswerOptionModifier(
                              questionIndex,
                              optionIndex,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
                        />
                      </div>

                      <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            moveAnswerOption(questionIndex, optionIndex, -1)
                          }
                          disabled={disabled || optionIndex === 0}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveAnswerOption(questionIndex, optionIndex, 1)
                          }
                          disabled={
                            disabled ||
                            optionIndex === question.answerOptions.length - 1
                          }
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            removeAnswerOption(questionIndex, optionIndex)
                          }
                          disabled={disabled || question.answerOptions.length <= 2}
                          className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addQuestion}
        disabled={disabled}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
      >
        Add weighted question
      </button>
    </div>
  );
}
