import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatUI({ messages, onSend, isTyping = false }) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    let uploadedInfo = null;
    if (file) {
      try {
        setUploadStatus("Uploading...");
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        uploadedInfo = data;
        setUploadStatus(`Uploaded ${data.filename}`);
      } catch (err) {
        setUploadStatus("Upload failed");
      } finally {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setUploadStatus(""), 1200);
      }
    }

    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const Message = ({ role, content }) => {
    const isUser = role === "user";
    return (
      <div
        className={`flex items-start gap-3 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isUser && (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            A
          </div>
        )}
        <div
          className={
            isUser
              ? "max-w-[80%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-2 bg-blue-600 text-white shadow-md animate-in fade-in slide-in-from-right-2 duration-200"
              : "max-w-[80%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-2 bg-white/70 backdrop-blur ring-1 ring-gray-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-200 dark:bg-neutral-800/70 dark:ring-neutral-700"
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
        {isUser && (
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            U
          </div>
        )}
      </div>
    );
  };

  const Typing = () => (
    <div className="flex items-center gap-2 text-gray-500">
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-gray-50 to-white shadow-lg dark:from-neutral-900 dark:to-neutral-900 dark:border-neutral-800">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, rgba(139,92,246,0.08), transparent 40%), radial-gradient(600px circle at 100% 0%, rgba(236,72,153,0.06), transparent 40%)",
        }}
      />

      <div
        ref={scrollRef}
        className="relative p-4 space-y-4 max-h-[28rem] overflow-y-auto"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8 dark:text-gray-400">
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md mb-3 animate-[float_6s_ease-in-out_infinite]">
              A
            </div>
            <p className="text-sm">
              Ask anything about your documents. Upload files to get started.
            </p>
          </div>
        )}

        {messages.map((m, idx) => (
          <Message key={idx} role={m.role} content={m.content} />
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              A
            </div>
            <div className="rounded-2xl px-4 py-2 bg-white/70 backdrop-blur ring-1 ring-gray-200 shadow-sm dark:bg-neutral-800/60 dark:ring-neutral-700">
              <Typing />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="relative">
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-xl border bg-white/90 backdrop-blur px-3 py-2 shadow-sm dark:bg-neutral-800/80 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-md px-2 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
              title="Attach file"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <input
              className="flex-1 bg-transparent p-2 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Send
            </button>
          </div>
          {(file || uploadStatus) && (
            <div className="px-1 pt-2 text-xs text-gray-600 flex items-center gap-2 dark:text-gray-400">
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
      </form>
    </div>
  );
}
