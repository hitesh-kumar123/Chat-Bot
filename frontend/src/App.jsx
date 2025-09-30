import { useEffect, useMemo, useState } from "react";
import ChatUI from "./ChatUI";

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme-dark");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("theme-dark", JSON.stringify(dark));
  }, [dark]);

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error contacting backend." },
      ]);
    }
    setIsTyping(false);
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-neutral-900 dark:text-neutral-100">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">
              RAG Offline Chatbot
            </h1>
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-lg border px-3 py-1.5 text-sm shadow-sm bg-white/80 backdrop-blur hover:shadow transition dark:bg-neutral-800 dark:border-neutral-700"
              aria-label="Toggle theme"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
          <ChatUI messages={messages} onSend={handleSend} isTyping={isTyping} />
        </div>
      </div>
    </div>
  );
}

export default App;
