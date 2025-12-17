import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

/* ----------------------------------
   Group RFQ items by vendor
-----------------------------------*/
function groupByVendor(rfqItems) {
  const map = {};

  rfqItems.forEach((item) => {
    item.vendors.forEach((v) => {
      const vendorId = v.vendor.vendorId;

      if (!map[vendorId]) {
        map[vendorId] = {
          vendor: v.vendor,
          contacts: v.contacts || [],
          sendWhatsApp: true,
          sendEmail: true,
          items: [],
        };
      }

      map[vendorId].items.push({
        itemId: item.itemId,
        description: item.description,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        uom: item.uom,
        qty: item.qty,
        customDescription: item.customDescription,
      });
    });
  });

  return Object.values(map);
}

export default function RfqVendorTabsModal({
  open,
  onOpenChange,
  rfqItems = [],
  onSendSingle,
  isSending,
}) {
  const vendors = useMemo(() => groupByVendor(rfqItems), [rfqItems]);

  const [activeTab, setActiveTab] = useState("");
  const [sendingVendorId, setSendingVendorId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [sentVendors, setSentVendors] = useState(new Set());

  const [globalWhatsApp, setGlobalWhatsApp] = useState(true);
  const [globalEmail, setGlobalEmail] = useState(true);

  /* ✅ Select first vendor by default */
  useEffect(() => {
    if (open && vendors.length > 0) {
      setActiveTab(vendors[0].vendor.vendorId);
    }
  }, [open, vendors]);

  async function handleSendVendor(v) {
    setSendingVendorId(v.vendor.vendorId);

    await onSendSingle({
      vendor: v.vendor,
      sendWhatsApp: v.sendWhatsApp,
      sendEmail: v.sendEmail,
      items: v.items,
    });

    setSentVendors((s) => new Set(s).add(v.vendor.vendorId));
    setSendingVendorId(null);
  }

  async function handleSendAll() {
    setSendingAll(true);

    for (const v of vendors) {
      if (sentVendors.has(v.vendor.vendorId)) continue;

      await onSendSingle({
        vendor: v.vendor,
        sendWhatsApp: globalWhatsApp,
        sendEmail: globalEmail,
        items: v.items,
      });

      setSentVendors((s) => new Set(s).add(v.vendor.vendorId));
    }

    setSendingAll(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-11/12 max-h-[90vh] overflow-auto w-full">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle className="text-indigo-600">
            Send RFQ to Vendors
          </DialogTitle>

          {/* Global actions */}
          <div className="flex justify-end gap-3 mr-4">
            <div className="flex justify-end gap-4 ">
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  checked={globalWhatsApp}
                  onCheckedChange={setGlobalWhatsApp}
                />
                WhatsApp
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  checked={globalEmail}
                  onCheckedChange={setGlobalEmail}
                />
                Email
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={sendingVendorId || sendingAll}
              onClick={handleSendAll}
            >
              {sendingAll ? "Sending..." : "Send All RFQs"}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex gap-1 bg-transparent border">
            {vendors.map((v) => (
              <TabsTrigger
                key={v.vendor.vendorId}
                value={v.vendor.vendorId}
                className="rounded-t-md border px-4 data-[state=active]:bg-black data-[state=active]:text-white cursor-pointer "
              >
                {v.vendor.name}
                {sentVendors.has(v.vendor.vendorId) && (
                  <CheckCircle className="ml-2 text-green-600" size={16} />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {vendors.map((v) => (
            <TabsContent
              key={v.vendor.vendorId}
              value={v.vendor.vendorId}
              className="border rounded-md p-4 space-y-6"
            >
              {/* Vendor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                <div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {v.vendor.name}
                  </div>
                  <div className="text-sm">Vendor ID: {v.vendor.vendorId}</div>
                  <div className="text-sm">{v.vendor.email}</div>
                  <div className="text-sm">{v.vendor.phone}</div>
                </div>

                <div className="text-sm">
                  <div>{v.vendor.address}</div>
                  <div>
                    {v.vendor.city}, {v.vendor.state}
                  </div>
                  <div className="font-medium">GST: {v.vendor.gst}</div>
                </div>

                {v.contacts.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-semibold mb-2">Contact Persons</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {v.contacts.map((c, i) => (
                        <div
                          key={i}
                          className="border rounded-md p-3 text-sm bg-card flex justify-between"
                        >
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-muted-foreground">
                              {c.designation}
                            </div>
                          </div>
                          <div>
                            <div className="text-right">{c.phone}</div>
                            <div className="text-right">{c.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {v.items.map((i, idx) => (
                  <div key={i.itemId} className="border rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <div className="py-1 px-3 bg-indigo-600 text-white rounded">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <div className="font-semibold">{i.description}</div>
                          <div className="text-xs text-muted-foreground">
                            ({i.categoryName} › {i.subCategoryName})
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {i.itemId} • {i.uom}
                        </div>
                      </div>
                    </div>
                    <div className="grid  gap-4 mt-3">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Quantity
                        </label>
                        <Input value={i.qty} readOnly disabled />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Custom Description
                        </label>
                        <Textarea
                          value={i.customDescription}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Actions */}
              {/* <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={v.sendWhatsApp}
                      onCheckedChange={(val) => (v.sendWhatsApp = val)}
                    />
                    WhatsApp
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={v.sendEmail}
                      onCheckedChange={(val) => (v.sendEmail = val)}
                    />
                    Email
                  </div>
                </div>

                <Button
                  disabled={sendingAll || sendingVendorId}
                  onClick={() => handleSendVendor(v)}
                >
                  {sendingVendorId === v.vendor.vendorId
                    ? "Sending..."
                    : "Send RFQ"}
                </Button>
              </div> */}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
