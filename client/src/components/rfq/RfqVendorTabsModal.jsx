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
import {
  CheckCircle,
  CircleAlert,
  CircleCheckBig,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import RfqPdfPreviewModal from "./RfqPdfPreviewModal";
import RfqVendorTab from "./RfqVendorTab";
import RichTextEditor from "../ui/RichTextEditor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MultiEmailInput from "../ui/MultiEmailInput";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeValue, isVendorValid, getVendorError } from "./utils";
import { cx } from "class-variance-authority";
import { toast } from "sonner";
import { useCreateRfq } from "../../hooks/useRfq.js";
import { CircleX } from "lucide-react";

/* ----------------------------------
   Group RFQ items by vendor
-----------------------------------*/
function groupByVendor(rfqItems) {
  const map = {};

  rfqItems.forEach((item) => {
    item.vendors.forEach((v) => {
      const id = v.vendor.vendorId;

      if (!map[id]) {
        map[id] = {
          vendor: v.vendor,
          contacts: v.contacts || [],
          items: [],
        };
      }

      map[id].items.push({
        itemId: item.itemId,
        description: item.description,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        uom: item.uom,
        qty: item.qty,
        customDescription: item.customDescription,
        files: item.files || [],
      });
    });
  });

  return Object.values(map);
}

export default function RfqVendorTabsModal({
  open,
  onOpenChange,
  rfqItems = [],
}) {
  const baseVendors = useMemo(() => groupByVendor(rfqItems), [rfqItems]);

  const [vendors, setVendors] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [sentVendors, setSentVendors] = useState(new Set());
  const [failedVendors, setFailedVendors] = useState(new Set());

  const [sendingAll, setSendingAll] = useState(false);

  const [globalWhatsApp, setGlobalWhatsApp] = useState(true);
  const [globalEmail, setGlobalEmail] = useState(true);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [emailTemplate, setEmailTemplate] = useState(`
    <p>Dear {{vendorName}},</p>
    <p>Please find attached the RFQ {{rfqNo}}.</p>
    <p>Regards,<br/>Procurement Team</p>
  `);

  const [ccEmails, setCcEmails] = useState([]);
  const [bccEmails, setBccEmails] = useState([]);

  const [whatsappTemplate, setWhatsappTemplate] = useState(
    `Dear {{vendorName}},\n\nPlease find RFQ {{rfqNo}} at the link below.\n\n{{pdfUrl}}\n\n{{itemSpecifications}}\n\nThank you`
  );

  const createRfqMutation = useCreateRfq();

  useEffect(() => {
    if (!open) return;

    setVendors(
      baseVendors.map((v) => ({
        ...v,
        email: normalizeValue(v.vendor.email),
        phone: normalizeValue(v.vendor.phone),
        selectedContactIndex: null,
      }))
    );

    if (baseVendors.length > 0) {
      setActiveTab(String(baseVendors[0].vendor.vendorId));
    }
  }, [open, baseVendors]);

  async function processRfqBatch({
    shouldProcess,
    onSuccessMessage,
    onFailureMessage,
  }) {
    setSendingAll(true);

    for (const v of vendors) {
      const vendorId = v.vendor.vendorId;

      if (!shouldProcess(v)) continue;

      setActiveTab(String(vendorId));

      try {
        // Create FormData
        const payloadObject = {
          vendor: {
            ...v.vendor,
            email: v.email,
            phone: v.phone,
          },
          sendEmail: globalEmail,
          sendWhatsApp: globalWhatsApp,
          sendEmail: globalEmail,
          sendWhatsApp: globalWhatsApp,
          emailTemplate,
          whatsappTemplate,
          cc: ccEmails,
          bcc: bccEmails,
          items: v.items,
        };

        const formData = new FormData();
        formData.append("data", JSON.stringify(payloadObject));

        // Append files
        v.items.forEach((item) => {
          if (item.files && item.files.length > 0) {
            item.files.forEach((file) => {
              formData.append(`file_${item.itemId}`, file);
            });
          }
        });

        const res = await createRfqMutation.mutateAsync(formData);

        toast.success(onSuccessMessage(v, res));

        setSentVendors((prev) => new Set(prev).add(vendorId));
        setFailedVendors((prev) => {
          const next = new Set(prev);
          next.delete(vendorId);
          return next;
        });
      } catch (err) {
        console.error("RFQ failed for vendor:", vendorId, err);

        toast.error(onFailureMessage(v, err));

        setFailedVendors((prev) => new Set(prev).add(vendorId));
      }
    }

    setSendingAll(false);
  }

  function validateVendors(filterFn) {
    for (const v of vendors) {
      if (!filterFn(v)) continue;

      if (!isVendorValid(v, globalEmail, globalWhatsApp)) {
        toast.error(`Email or Phone Missing or Invalid for ${v.vendor.name}!`);
        setActiveTab(String(v.vendor.vendorId));
        return false;
      }
    }
    return true;
  }

  async function handleSendAll() {
    if (allRfqsSent) {
      toast.info("All RFQs are already sent");
      return;
    }

    const shouldProcess = (v) => !sentVendors.has(v.vendor.vendorId);

    if (!validateVendors(shouldProcess)) return;

    await processRfqBatch({
      shouldProcess,
      onSuccessMessage: (v, res) => `RFQ ${res.rfqNo} created`,
      onFailureMessage: (v) => `Failed to send RFQ to ${v.vendor.name}`,
    });
  }

  async function handleRetryFailed() {
    if (failedVendors.size === 0) {
      toast.info("No failed RFQs to retry");
      return;
    }

    const shouldProcess = (v) => failedVendors.has(v.vendor.vendorId);

    if (!validateVendors(shouldProcess)) return;

    await processRfqBatch({
      shouldProcess,
      onSuccessMessage: (v, res) => `RFQ ${res.rfqNo} resent successfully`,
      onFailureMessage: (v) => `Retry failed for ${v.vendor.name}`,
    });
  }

  useEffect(() => {
    if (!sendingAll) return;

    const handleBeforeUnload = (e) => {
      // Required for modern browsers
      e.preventDefault();

      // Chrome requires returnValue to be set
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sendingAll]);

  const allRfqsSent = vendors.length > 0 && sentVendors.size === vendors.length;

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        !sendingAll && onOpenChange();
      }}
    >
      <DialogContent className="sm:max-w-11/12 max-h-[90vh] overflow-auto w-full p-2 md:p-6">
        <DialogHeader className="md:flex-row items-start md:items-center md:justify-between">
          <DialogTitle className="text-indigo-600">
            Send RFQ to Vendors
          </DialogTitle>

          <div className="grid grid-cols-2 md:flex items-center gap-3 mr-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={globalWhatsApp}
                onCheckedChange={setGlobalWhatsApp}
                disabled={sendingAll || allRfqsSent}
              />
              WhatsApp
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={globalEmail}
                disabled={sendingAll || allRfqsSent}
                onCheckedChange={setGlobalEmail}
              />
              Email
            </div>
            <Button
              variant="outline"
              disabled={sendingAll}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {failedVendors.size === 0 && (
              <Button
                disabled={sendingAll || allRfqsSent}
                onClick={handleSendAll}
                className={cx(
                  "bg-indigo-600 hover:bg-indigo-700 hover:text-white text-white",
                  allRfqsSent &&
                    "bg-green-600 hover:bg-green-700 text-white hover:text-white"
                )}
              >
                <Loader
                  className={cx("hidden", sendingAll && "!block animate-spin")}
                />
                {allRfqsSent
                  ? "All RFQs Sent"
                  : sendingAll
                  ? "Sending..."
                  : "Send All RFQs"}

                {allRfqsSent && <CircleCheckBig />}
              </Button>
            )}

            {failedVendors.size > 0 && (
              <Button
                variant="destructive"
                disabled={sendingAll || failedVendors.size === 0}
                onClick={handleRetryFailed}
              >
                <Loader
                  className={cx("hidden", sendingAll && "!block animate-spin")}
                />
                {allRfqsSent
                  ? "All RFQs Sent"
                  : sendingAll
                  ? "Sending..."
                  : `Retry Failed (${failedVendors.size})`}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Templates Section */}
        <Collapsible
          open={showTemplates}
          onOpenChange={setShowTemplates}
          className="border rounded-md mb-4 bg-muted/20"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 font-medium text-sm">
              <span>Customize Message Templates & CC, BCC</span>
              {showTemplates ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Available placeholders:{" "}
              <code className="bg-muted px-1 rounded">{"{{vendorName}}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{{rfqNo}}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{{pdfUrl}}"}</code> (WA
              only),{" "}
              <code className="bg-muted px-1 rounded">
                {"{{itemSpecifications}}"}
              </code>{" "}
              (WA only).
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Email Inputs */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Email Message (HTML)
                  </div>
                  <div className="grid gap-2">
                    <MultiEmailInput
                      placeholder="CC (Press Enter to add)"
                      value={ccEmails}
                      onChange={setCcEmails}
                      disabled={sendingAll}
                    />
                    <MultiEmailInput
                      placeholder="BCC (Press Enter to add)"
                      value={bccEmails}
                      onChange={setBccEmails}
                      disabled={sendingAll}
                    />
                  </div>
                  <RichTextEditor
                    mode="html"
                    value={emailTemplate}
                    onChange={setEmailTemplate}
                    disabled={sendingAll}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">WhatsApp Message</div>
                <RichTextEditor
                  mode="whatsapp"
                  value={whatsappTemplate}
                  onChange={setWhatsappTemplate}
                  disabled={sendingAll}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {allRfqsSent && (
          <div className="flex items-center justify-center w-full">
            <div className="px-4 py-2 rounded-full flex items-center gap-2 bg-green-600 text-white text-sm">
              <p>All RFQs have been sent successfully</p>
              <CircleCheckBig className="size-4" />
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-auto w-[87vw] sm:w-full">
            <TabsList className="border bg-transparent gap-1 ">
              {vendors.map((v) => {
                const vendorId = v.vendor.vendorId;
                const invalid = !isVendorValid(v, globalEmail, globalWhatsApp);
                const failed = failedVendors.has(vendorId);
                const sent = sentVendors.has(vendorId);
                const isActiveTab = activeTab === String(v.vendor.vendorId);

                return (
                  <TabsTrigger
                    key={vendorId}
                    value={String(vendorId)}
                    disabled={sendingAll}
                    className={cx(
                      "data-[state=active]:bg-indigo-100 cursor-pointer data-[state=active]:border data-[state=active]:border-indigo-300",
                      sent &&
                        "data-[state=active]:bg-green-700 bg-green-600 !text-white data-[state=active]:border-green-600",
                      failed &&
                        "bg-red-100 data-[state=active]:bg-red-600 bg-red-500 !text-white data-[state=active]:border-red-600"
                    )}
                  >
                    {v.vendor.name}

                    {/* ❌ Failed */}
                    {((failed && !sent && !sendingAll) ||
                      (sendingAll && !isActiveTab && !sent)) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <CircleX size={16} className="ml-2 text-white" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Failed to send RFQ. You can retry.
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {sent && (
                      <CheckCircle size={16} className="ml-2 text-white" />
                    )}

                    {activeTab === String(v.vendor.vendorId) && sendingAll && (
                      <Loader
                        className={cx(
                          "animate-spin ml-2 text-black",
                          failed && "text-white"
                        )}
                      />
                    )}

                    {invalid && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <CircleAlert
                              size={16}
                              className="ml-2 text-red-600"
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getVendorError(v, globalEmail, globalWhatsApp)}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {vendors.map((v) => (
            <TabsContent
              key={v.vendor.vendorId}
              value={String(v.vendor.vendorId)}
            >
              <RfqVendorTab
                vendor={v}
                onChange={(updated) =>
                  setVendors((prev) =>
                    prev.map((x) =>
                      x.vendor.vendorId === updated.vendor.vendorId
                        ? updated
                        : x
                    )
                  )
                }
                onPreview={() => setPreviewOpen(true)}
                requireEmail={globalEmail}
                sendingAll={sendingAll}
                requirePhone={globalWhatsApp}
                rfqSent={sentVendors.has(v.vendor.vendorId)}
                rfqFailed={failedVendors.has(v.vendor.vendorId)}
              />
            </TabsContent>
          ))}
        </Tabs>

        <RfqPdfPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          vendor={vendors[0]?.vendor}
          items={vendors[0]?.items}
        />
      </DialogContent>
    </Dialog>
  );
}
