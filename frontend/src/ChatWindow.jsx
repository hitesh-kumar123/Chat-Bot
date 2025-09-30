import { useState } from "react";

export default function ChatWindow({ onQuery, messages, isTyping }) {
  const [input, setInput] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await onQuery(text);
  };

  return (
    <div className="relative rounded-2xl border bg-white/90 dark:bg-neutral-900/80 backdrop-blur p-3 shadow-sm">
      <div className="space-y-3 max-h-[26rem] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={
                m.role === "user"
                  ? "inline-block rounded-2xl px-4 py-2 bg-blue-600 text-white"
                  : "inline-block rounded-2xl px-4 py-2 bg-gray-100 dark:bg-neutral-800"
              }
            >
              {m.content}
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {m.sources.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => m.onOpenSource?.(s)}
                    className="underline mr-2"
                  >
                    [{i + 1}] {s.file_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="text-left text-gray-500">Assistant is typing…</div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-3 flex items-center gap-2 rounded-xl border bg-white/90 dark:bg-neutral-800/80 px-2 py-2"
      >
        <input
          className="flex-1 bg-transparent p-2 outline-none"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
