import { useEffect, useState } from "react";
import MahaBootSequence from "./MahaBootSequence";
import MahaDashboard from "./MahaDashboard";
import { initializeHudBridge } from "@/lib/system/hudBridge";
import { HumanApprovalModal } from "@/components/HumanApprovalModal";

export default function MahaApp() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    initializeHudBridge();
  }, []);
  if (!booted) return <MahaBootSequence onComplete={() => setBooted(true)} />;
  return (
    <>
      <MahaDashboard />
      <HumanApprovalModal />
    </>
  );
}

