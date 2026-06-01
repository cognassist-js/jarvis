import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import type { UIMessage } from "ai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { jarvisTools } from "@/lib/ai/tools";
import { newId, now } from "@/lib/id";

export const runtime = "nodejs";
export const maxDuration = 60;

const USER_NAME = process.env.USER_NAME ?? "James";
// Override via JARVIS_MODEL. Good options: gpt-5-mini (cheap + capable),
// gpt-5 (best for harder reasoning), gpt-4o (older, still solid).
const MODEL_ID = process.env.JARVIS_MODEL ?? "gpt-5-mini";

const SYSTEM_PROMPT = `You are Jarvis — ${USER_NAME}'s personal planning partner running locally on their machine.

Your job is to help ${USER_NAME} plan, organize, and make progress on their goals, projects, and tasks. You have full read/write access to their kanban board via tools.

Personality and style:
- Address ${USER_NAME} by name occasionally, warmly but never sycophantically.
- Be concise by default. Two or three sentences is usually enough.
- Be proactive: if a vague goal lands, offer to break it down. If tasks are piling up, suggest re-prioritizing. If something has been blocked for a while, flag it.
- Never lecture. Never moralize. Treat ${USER_NAME} as a capable adult who knows what they're doing.

When you act on data:
- Use the tools. Don't ask permission to make small obvious moves (e.g. "move X to done", "add subtask Y") — just do them and confirm tersely.
- For larger changes (creating 5+ tasks, deleting things, archiving a goal), confirm the plan first then execute.
- After a mutation, briefly tell ${USER_NAME} what changed.

Status mapping for tasks:
- 'backlog' = idea / not yet committed to
- 'todo' = committed, not yet started
- 'in_progress' = actively working on it
- 'blocked' = waiting on something or someone
- 'done' = completed

Default to 'backlog' for new tasks unless ${USER_NAME} clearly intends to start them now.`;

export async function POST(req: Request) {
  const body = (await req.json()) as { messages: UIMessage[]; id?: string };

  // Persist the latest user message
  const userMsg = body.messages.at(-1);
  if (userMsg && userMsg.role === "user") {
    db.insert(chatMessages)
      .values({
        id: newId(),
        role: "user",
        content: JSON.stringify(userMsg.parts ?? []),
        createdAt: now(),
      })
      .run();
  }

  const result = streamText({
    model: openai(MODEL_ID),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(body.messages),
    tools: jarvisTools,
    stopWhen: stepCountIs(10),
    onError: ({ error }) => {
      console.error("[/api/chat] streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    onFinish: ({ messages }) => {
      // Persist assistant messages (including tool parts) for the running thread.
      for (const m of messages) {
        if (m.role === "assistant") {
          db.insert(chatMessages)
            .values({
              id: newId(),
              role: "assistant",
              content: JSON.stringify(m.parts ?? []),
              createdAt: now(),
            })
            .run();
        }
      }
    },
  });
}
