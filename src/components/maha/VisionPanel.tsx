import {
  Camera,
  Eye,
  ScanLine,
  Cpu,
} from "lucide-react";

interface Detection {
  id: string;
  label: string;
  confidence: number;
}

interface Props {
  imageUrl?: string;
  detections?: Detection[];
  ocrText?: string;
  status?: "idle" | "analyzing";
}

export default function VisionPanel({
  imageUrl,
  detections = [],
  ocrText = "",
  status = "idle",
}: Props) {
  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl overflow-hidden">

      {/* HEADER */}
      <div className="border-b border-[#152533] p-4 flex justify-between items-center">

        <div className="flex items-center gap-2">
          <Eye
            size={18}
            className="text-cyan-300"
          />

          <span className="text-cyan-300 tracking-[0.2em] text-sm">
            VISION AGENT
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Cpu
            size={14}
            className="text-cyan-300"
          />

          {status === "analyzing"
            ? "ANALYZING"
            : "STANDBY"}
        </div>
      </div>

      {/* CAMERA FEED */}
      <div className="relative h-[320px] bg-black">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="vision"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <Camera size={40} />
          </div>
        )}

        {/* HUD CORNERS */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-cyan-400" />

        <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-cyan-400" />

        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-cyan-400" />

        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-cyan-400" />

        {/* SCAN EFFECT */}
        {status === "analyzing" && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-[2px] bg-cyan-400 animate-[scan_2s_linear_infinite]" />
          </div>
        )}
      </div>

      {/* DETECTIONS */}
      <div className="p-4">

        <div className="flex items-center gap-2 mb-3">
          <ScanLine
            size={16}
            className="text-cyan-300"
          />

          <span className="text-cyan-300 text-xs tracking-widest">
            DETECTIONS
          </span>
        </div>

        <div className="space-y-2">

          {detections.map((item) => (
            <div
              key={item.id}
              className="flex justify-between bg-[#081018] border border-[#152533] rounded-lg p-2"
            >
              <span>
                {item.label}
              </span>

              <span className="text-cyan-300">
                {item.confidence}%
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* OCR */}
      <div className="border-t border-[#152533] p-4">

        <div className="text-cyan-300 text-xs tracking-widest mb-2">
          OCR OUTPUT
        </div>

        <div className="bg-[#081018] rounded-lg border border-[#152533] p-3 text-xs font-mono text-slate-300 max-h-[120px] overflow-y-auto">
          {ocrText ||
            "No text detected"}
        </div>
      </div>
    </div>
  );
}