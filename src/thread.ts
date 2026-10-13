export type Status = "waiting" | "done" | "failed"

export interface Exchange {
  readonly id: number
  readonly question: string
  status: Status
  answer: string
}

export interface State {
  nextID: number
  threads: Record<string, Exchange[]>
}

/** Answered exchanges replayed with each new question, oldest dropped first. */
export const HISTORY_LIMIT = 20

const INSTRUCTIONS = [
  "The user is asking a side question about the conversation so far, from a separate panel.",
  "The side thread is not part of the main conversation and is never added to it.",
  "Answer directly and concisely in markdown from what you already know.",
  "Do not call any tools and do not take any actions.",
].join(" ")

export function buildPrompt(earlier: readonly Exchange[], question: string) {
  const replay = earlier
    .filter((exchange) => exchange.status === "done")
    .slice(-HISTORY_LIMIT)
    .map((exchange) => `<question>\n${exchange.question}\n</question>\n<answer>\n${exchange.answer}\n</answer>`)
  return [
    INSTRUCTIONS,
    ...(replay.length > 0 ? ["Earlier side questions and your answers, oldest first:", replay.join("\n\n")] : []),
    `Side question:\n${question}`,
  ].join("\n\n")
}

// A model that tries to call a tool anyway gets no text back, because generation runs no tool loop.
export const EMPTY_ANSWER =
  "No answer came back. Side questions can only use what is already in the conversation, so try asking differently."

export function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return String(error)
}
