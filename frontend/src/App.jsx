import { useEffect, useMemo, useState } from "react";
import ChatWindow from "./ChatWindow";
import Uploader from "./Uploader";
import ResultItem from "./ResultItem";
import SourceModal from "./SourceModal";

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [results, setResults] = useState([]);
  const [modalItem, setModalItem] = useState(null);
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
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          onOpenSource: setModalItem,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error contacting backend." },
      ]);
    }
    setIsTyping(false);
  };

  const doSearch = async (query) => {
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }
    const res = await fetch("http://localhost:8000/search/similarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, k: 8 }),
    });
    const data = await res.json();
    setResults(data.results || []);
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
          <Uploader onUploaded={() => doSearch(null)} />
          <ChatWindow
            messages={messages}
            onQuery={handleSend}
            isTyping={isTyping}
          />
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((r, i) => (
                <ResultItem key={i} item={r} onOpen={setModalItem} />
              ))}
            </div>
          )}
        </div>
      </div>
      {modalItem && (
        <SourceModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}

export default App;
