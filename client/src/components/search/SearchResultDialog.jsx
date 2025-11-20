// src/components/search/SearchResultDialog.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"; // adjust shadcn imports to match your project
import { Button } from "@/components/ui/button";
import { Pin, PinOff, X } from "lucide-react";

/**
 * Props:
 * - open (bool)
 * - onOpenChange (fn)
 * - data: { item, vendors }
 * - onPin(item) -> callback when user pins this item
 * - isPinned (bool)
 */
export default function SearchResultDialog({
  open,
  onOpenChange,
  data,
  onPin,
  isPinned,
}) {
  if (!data) return null;

  const { item, vendors } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-11/12 max-h-[90vh] overflow-auto w-full">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-lg text-left text-indigo-600">
                {item.description}{" "}
                <span className="text-sm text-indigo-600">
                  ({item.uomName})
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {item.categoryName} › {item.subCategoryName}
              </p>
            </div>

            <div className="flex gap-2 mr-4">
              {isPinned ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onPin(data)}
                >
                  <PinOff />
                </Button>
              ) : (
                <Button size="sm" onClick={() => onPin(data)}>
                  <Pin />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {vendors && vendors.length > 0 ? (
            vendors.map((v) => (
              <div
                key={
                  v.vendor?.vendorId ||
                  v.vendor?.id ||
                  v.vendorId ||
                  v.mapping?.mappingId
                }
                className="p-4 border rounded-md bg-card"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold">
                      {v.vendor?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.vendor?.phone}, {v.vendor?.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.vendor?.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.vendor?.city}, {v.vendor?.state}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      GST: {v.vendor?.gst}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">
                      ₹{Number(v.mapping?.price || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {v.mapping?.uom}
                    </div>
                  </div>
                </div>

                {v.mapping?.notes && (
                  <div className="mt-2 text-xs border p-2 bg-yellow-50 rounded">
                    {v.mapping.notes}
                  </div>
                )}

                {v.contacts && v.contacts.length > 0 && (
                  <div className="mt-3 grid grid-cols-1  gap-2">
                    {v.contacts.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2 flex items-end justify-between border rounded"
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.designation}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-xs">{c.phone}</div>
                          <div className="text-xs">{c.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              No vendors found for this item.
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-end w-full">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
