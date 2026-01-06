import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, PinOff } from "lucide-react";
import { toast } from "sonner";

export default function RfqItemDetailsModal({
  open,
  onOpenChange,
  pinnedItems = [],
  onProceed,
  onUnpin,
}) {
  const [items, setItems] = useState([]);

  // Initialize editable state when modal opens
  useEffect(() => {
    if (open) {
      setItems(
        pinnedItems.map((p) => ({
          pinId: p.pinId,
          itemId: p.item.itemId,
          description: p.item.description,
          uom: p.item.uomName,
          categoryName: p.item.categoryName,
          subCategoryName: p.item.subCategoryName,
          qty: "",
          customDescription: "",
          vendors: p.vendors,
        }))
      );
    }
  }, [open, pinnedItems]);

  function updateItem(index, field, value) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  function handleProceed() {
    const invalid = items.some((i) => !i.qty || Number(i.qty) <= 0);
    if (invalid) {
      toast.warning("Please enter Qty for all items.");
      return;
    }

    onProceed(items);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-11/12 max-h-[90vh] overflow-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">
            RFQ – Item Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.itemId}
              className="border rounded-lg p-4 bg-card space-y-3"
            >
              <div className="flex items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                  <div className="py-1 px-3 bg-indigo-600 text-white rounded">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <div className="font-semibold">{item.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.categoryName} › {item.subCategoryName}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {item.itemId} • {item.uom}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onUnpin(item.pinId)}
                >
                  <PinOff size={16} />
                </Button>
              </div>

              <div className="grid  gap-4">
                <Input
                  type="number"
                  placeholder="Qty *"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", e.target.value)}
                />

                <Textarea
                  placeholder="Custom description (optional)"
                  rows={1}
                  value={item.customDescription}
                  className="min-h-fit"
                  onChange={(e) =>
                    updateItem(idx, "customDescription", e.target.value)
                  }
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground ml-1">
                    Specification PDF (Optional)
                  </label>
                  <Input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={(e) =>
                      updateItem(idx, "files", Array.from(e.target.files))
                    }
                  />
                  {item.files && item.files.length > 0 && (
                    <div className="flex flex-col gap-0.5 ml-1">
                      {item.files.map((f, i) => (
                        <div
                          key={i}
                          className="text-xs text-green-600 cursor-pointer hover:underline"
                          onClick={() =>
                            window.open(URL.createObjectURL(f), "_blank")
                          }
                        >
                          selected: {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white"
          >
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
