import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApprovalRequest {
  id: string;
  context: string;
  reason: string;
  timestamp: string | Date;
}

export const HumanApprovalModal: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/approvals/list");
        if (!res.ok) return;
        const data = (await res.json()) as { pending: ApprovalRequest[] };
        if (!cancelled) setPendingApprovals(data.pending ?? []);
      } catch {
        /* ignore */
      }
    };
    poll();
    const t = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      await fetch("/api/approvals/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approvalId: id, decision }),
      });
      setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      {pendingApprovals.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 w-96 bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden z-50"
        >
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-amber-400 font-mono text-sm tracking-wider uppercase">
              Human Approval Required
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Context</p>
              <p className="text-slate-200 text-sm">{req.context}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Reason</p>
              <p className="text-slate-300 text-sm italic">"{req.reason}"</p>
            </div>
            <p className="text-[10px] text-slate-600 font-mono">
              ID: {req.id.substring(0, 8)}... • {new Date(req.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="p-4 border-t border-slate-800 flex gap-3 bg-slate-950/50">
            <button
              onClick={() => handleDecision(req.id, "rejected")}
              disabled={processingId === req.id}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 font-mono text-xs uppercase"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => handleDecision(req.id, "approved")}
              disabled={processingId === req.id}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50 font-mono text-xs uppercase"
            >
              {processingId === req.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default HumanApprovalModal;