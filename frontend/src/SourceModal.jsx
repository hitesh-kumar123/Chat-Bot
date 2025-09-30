import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.mjs";

export default function SourceModal({ item, onClose }) {
  const audioRef = useRef(null);
  const waveRef = useRef(null);
  const [pdfCanvas, setPdfCanvas] = useState(null);

  useEffect(() => {
    if (!item) return;
    if (item.file_type === "audio") {
      if (!waveRef.current) {
        const ws = WaveSurfer.create({
          container: "#wave",
          waveColor: "#64748b",
          progressColor: "#1e293b",
          height: 80,
        });
        waveRef.current = ws;
        const url = `http://localhost:8000${
          item.filepath?.includes("/storage") ? "" : "/storage"
        }${item.filepath?.split("storage")?.[1] ?? ""}`;
        ws.load(url);
        if (item.timestamp) {
          const [s0] = String(item.timestamp).split("-");
          const startSec = parseFloat(s0) / 100.0;
          ws.on("ready", () => ws.setTime(startSec));
        }
      }
    }
    if (item.file_type === "pdf") {
      const url = `http://localhost:8000${
        item.filepath?.includes("/storage") ? "" : "/storage"
      }${item.filepath?.split("storage")?.[1] ?? ""}`;
      const pageNum = item.page_number || 1;
      const canvas = document.getElementById("pdf-canvas");
      const ctx = canvas.getContext("2d");
      (async () => {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        setPdfCanvas(canvas);
      })();
    }
    return () => {
      if (waveRef.current) {
        waveRef.current.destroy();
        waveRef.current = null;
      }
    };
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-[90vw] max-w-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{item.file_name}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded border">
            Close
          </button>
        </div>
        {item.file_type === "image" && (
          <img
            className="max-h-[70vh] w-auto mx-auto rounded"
            src={`http://localhost:8000${
              item.filepath?.includes("/storage") ? "" : "/storage"
            }${item.filepath?.split("storage")?.[1] ?? ""}`}
          />
        )}
        {item.file_type === "pdf" && (
          <canvas id="pdf-canvas" className="mx-auto rounded" />
        )}
        {item.file_type === "audio" && (
          <div>
            <div id="wave" />
          </div>
        )}
        {item.file_type === "text" && (
          <div className="text-sm whitespace-pre-wrap">{item.content}</div>
        )}
      </div>
    </div>
  );
}
