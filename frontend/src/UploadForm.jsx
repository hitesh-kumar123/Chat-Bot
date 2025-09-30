import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setStatus("Uploading...");
    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setStatus(`Uploaded ${data.filename} (${data.bytes} bytes)`);
    } catch (e) {
      setStatus("Upload failed");
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="submit"
        className="px-3 py-2 bg-gray-800 text-white rounded"
      >
        Upload
      </button>
      {status && <span className="text-sm text-gray-600">{status}</span>}
    </form>
  );
}
