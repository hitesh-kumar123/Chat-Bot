import { useCallback, useState } from "react";

export default function Uploader({ onUploaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("");

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await upload(file);
  }, []);

  const upload = async (file) => {
    setStatus(`Uploading ${file.name}...`);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("http://localhost:8000/ingest", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setStatus(`Indexed ${data.vectors_indexed} vectors from ${data.file}`);
    onUploaded?.(data);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={
        "mt-2 rounded-xl border-2 border-dashed p-6 text-center " +
        (dragOver
          ? "bg-blue-50 border-blue-400"
          : "bg-white dark:bg-neutral-900")
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Drag & drop files here or
      </p>
      <label className="inline-block mt-2 cursor-pointer rounded px-3 py-2 bg-blue-600 text-white">
        Browse
        <input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </label>
      {status && <div className="mt-2 text-sm">{status}</div>}
    </div>
  );
}
