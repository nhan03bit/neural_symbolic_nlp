/**
 * Generic hook for SSE-based chat features — the foundation for most pages in the app.
 *
 * Every feature (tokenize, embed, neural net, attention, etc.) follows the same pattern:
 * 1. User types a message and hits send
 * 2. A POST request streams SSE events from the server
 * 3. Each event updates the state and re-renders the result component
 *
 * This hook encapsulates that pattern. Each feature provides:
 * - `endpoint` — the server route to POST to
 * - `initState()` — creates fresh state for a new request
 * - `onEvent(parsed, state)` — handles each SSE event, updates state, returns JSX to render
 *
 * The hook manages message history, loading state, input, and the streaming lifecycle.
 *
 * @see {@link file://src/client/lib/sse.ts} for the SSE reader this hook uses
 */
import type { Child } from "hono/jsx";
import type { Message } from "../../shared/types/message.js";

import { useState } from "hono/jsx";
import { readSSE } from "../lib/sse.js";

export type UseSSEChatOptions<TState, TEvent = Record<string, unknown>> = {
  endpoint: string;
  title: string;
  tagline: string;
  buildBody?: (input: string) => unknown;
  initState: () => TState;
  /**
   * Returns JSX to draw now, or undefined to leave the view as it is. `redraw` draws later, for a
   * feature that skips events and must not leave the last one undrawn when the stream pauses.
   */
  onEvent: (parsed: TEvent, state: TState, redraw: (content: Child) => void) => Child | undefined;
  mode?: "json" | "multiline";
};

export type UseSSEChatReturn = {
  input: string;
  loading: boolean;
  messages: Message[];
  sendMessage: () => Promise<void>;
  setInput: (value: string) => void;
  tagline: string;
  title: string;
};

export function useSSEChat<TState, TEvent = Record<string, unknown>>(
  options: UseSSEChatOptions<TState, TEvent>,
): UseSSEChatReturn {
  const {
    endpoint,
    title,
    tagline,
    buildBody = (input: string) => ({ message: input }),
    initState,
    onEvent,
    mode,
  } = options;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      content: input,
      id: crypto.randomUUID(),
      role: "user",
    };
    const assistantId = crypto.randomUUID();

    setMessages((previous) => [
      ...previous,
      userMessage,
      { content: "", id: assistantId, role: "assistant" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const state = initState();
      const show = (content: Child) =>
        setMessages((previous) =>
          previous.map((m) => (m.id === assistantId ? { ...m, content } : m)),
        );
      const result = await readSSE<TEvent>({
        endpoint,
        body: buildBody(input),
        mode,
        onOpen: () => setLoading(false),
        onEvent: (parsed) => {
          const content = onEvent(parsed, state, show);
          if (content !== undefined) show(content);
        },
      });

      if (!result.ok) {
        setMessages((previous) =>
          previous.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${result.error}` }
              : m,
          ),
        );
      }
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          content: "Something went wrong.",
          id: crypto.randomUUID(),
          role: "assistant",
        },
      ]);
      setLoading(false);
    }
  };

  return { input, loading, messages, sendMessage, setInput, tagline, title };
}
