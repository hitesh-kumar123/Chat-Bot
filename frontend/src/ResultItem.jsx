export default function ResultItem({ item, onOpen }) {
  const {
    file_type,
    file_name,
    content,
    score,
    filepath,
    page_number,
    timestamp,
    width,
    height,
  } = item;
  return (
    <div className="rounded-lg border p-3 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {file_name} {page_number ? `(p. ${page_number})` : ""}{" "}
          {timestamp ? `(${timestamp})` : ""}
        </span>
        <span>score: {score?.toFixed?.(3)}</span>
      </div>
      {file_type !== "image" && <p className="mt-2 text-sm">{content}</p>}
      {file_type === "image" && (
        <div className="mt-2">
          <img
            src={`http://localhost:8000${
              filepath?.includes("/storage") ? "" : "/storage"
            }${filepath?.split("storage")?.[1] ?? ""}`}
            alt={file_name}
            className="h-24 w-auto rounded cursor-pointer"
            onClick={() => onOpen(item)}
          />
        </div>
      )}
      <div className="mt-2">
        <button
          className="text-blue-600 underline"
          onClick={() => onOpen(item)}
        >
          Open
        </button>
      </div>
    </div>
  );
}
