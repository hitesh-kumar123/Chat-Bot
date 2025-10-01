import { useRef, useState } from "react";

export default function ChatWindow({ onQuery, messages, isTyping }) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    let imageUrl = null;
    if (file) {
      try {
        setUploadStatus("Uploading image…");
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("http://localhost:8000/ingest", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        imageUrl = `http://localhost:8000/storage/${data.file}`;
        setUploadStatus("");
      } catch (err) {
        setUploadStatus("Upload failed");
        setTimeout(() => setUploadStatus(""), 1200);
      } finally {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }

    if (!text && !imageUrl) return;
    setInput("");
    await onQuery({ text, imageUrl });
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
              <div className="space-y-2">
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="uploaded"
                    className="max-h-60 rounded-lg shadow-sm"
                  />
                )}
                {m.content && <div>{m.content}</div>}
              </div>
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-md px-2 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
          title="Attach image"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
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
      {(file || uploadStatus) && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-2 dark:text-gray-400">
          {file && (
            <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 bg-white/80 dark:bg-neutral-800/60 dark:border-neutral-700">
              <span className="max-w-[14rem] truncate">{file.name}</span>
              <button
                type="button"
                className="text-red-500 hover:underline"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                remove
              </button>
            </span>
          )}
          {uploadStatus && <span>{uploadStatus}</span>}
        </div>
      )}
    </div>
  );
}
