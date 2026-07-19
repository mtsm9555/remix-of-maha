import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useRef } from "react";
import { useVision } from "@/hooks/useVision";
import ImagePreview from "./ImagePreview";

interface Props {
  onClose?: () => void;
}

export default function VisionPanel({ onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { image, uploadImage, loading, error } = useVision();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    e.target.value = "";
  };

  return (
    <div className="vision-panel" role="dialog" aria-label="Vision">
      <div className="vision-header">
        <ImageIcon size={18} />
        <h2>Vision</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vision panel"
            className="vision-close"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        type="button"
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload size={18} />
        {loading ? "Analyzing…" : "Upload Image"}
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleSelect}
      />

      {error && <div className="vision-analysis" role="alert">{error}</div>}

      {image && (
        <>
          <ImagePreview imageUrl={image.imageUrl} alt={image.filename} />
          {image.analysis && (
            <div className="vision-analysis">{image.analysis}</div>
          )}
        </>
      )}
    </div>
  );
}