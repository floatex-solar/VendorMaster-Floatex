import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RfqPdfPreviewModal({
  open,
  onOpenChange,
  vendor,
  items,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadPreview() {
      setLoading(true);

      // Get token from localStorage and use in Authorization header
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/rfqs/preview-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vendor, items }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setLoading(false);
    }

    loadPreview();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [open, vendor, items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-10/12 h-[90vh] overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b h-fit">
          <DialogTitle className="h-fit">RFQ PDF Preview</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            Generating preview...
          </div>
        ) : (
          <iframe
            title="RFQ PDF Preview"
            src={pdfUrl}
            className="h-[70vh] w-full"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
