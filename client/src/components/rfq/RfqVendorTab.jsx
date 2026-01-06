import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CircleCheck, CircleCheckBig, CircleX, FileText } from "lucide-react";
import { normalizeValue, isValidEmail, isValidPhone } from "./utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cx } from "class-variance-authority";
import LoadingSpinner from "../common/LoadingSpinner";

export default function RfqVendorTab({
  vendor,
  onChange,
  onPreview,
  requireEmail,
  requirePhone,
  sendingAll,
  rfqSent,
  rfqFailed,
}) {
  const v = vendor;

  /* ---------- Validation state ---------- */
  const emailMissing = requireEmail && !v.email;
  const phoneMissing = requirePhone && !v.phone;

  const emailInvalid = requireEmail && v.email && !isValidEmail(v.email);

  const phoneInvalid = requirePhone && v.phone && !isValidPhone(v.phone);

  const showEmailError = emailMissing || emailInvalid;
  const showPhoneError = phoneMissing || phoneInvalid;

  return (
    <div className="relative">
      {/* Vendor Details */}
      {sendingAll && (
        <div className="absolute h-full w-full flex items-center justify-center bg-black/10 rounded-md z-60">
          <LoadingSpinner
            text="Creating RFQ"
            className="bg-indigo-600 !w-fit px-4 py-2 rounded-md text-white animate-pulse"
          />
        </div>
      )}

      {rfqSent && !sendingAll && (
        <div className="absolute h-full w-full flex items-center justify-center bg-black/10 rounded-md z-60">
          <div className="flex items-center gap-2 w-fit bg-green-600 text-white px-4 py-2 rounded-md">
            <p>RFQ Created</p>
            <CircleCheckBig className="size-4" />
          </div>
        </div>
      )}

      {rfqFailed && !sendingAll && (
        <div className="absolute h-full w-full flex items-center justify-center bg-black/10 rounded-md z-60">
          <div className="flex items-center gap-2 w-fit bg-red-600 text-white px-4 py-2 rounded-md">
            <p>RFQ Failed</p>
            <CircleX className="size-4" />
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4 border rounded-lg mb-4 p-4 bg-muted/30">
        <div>
          <div className="flex gap-2 items-center">
            <h4 className="text-lg font-semibold text-indigo-600">
              {v.vendor.name}
            </h4>
            <Button
              size="sm"
              className="py-1 rounded h-fit bg-red-600 hover:bg-red-700"
              onClick={onPreview}
            >
              <FileText />
            </Button>
          </div>

          <div className="mt-2 space-y-2">
            {/* Email */}
            <div className="grid grid-cols-[max-content_1fr] gap-4 items-center">
              <Label for="email">Email :</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="email"
                    placeholder="Vendor Email"
                    type="email"
                    value={v.email}
                    onChange={(e) =>
                      onChange({
                        ...v,
                        email: normalizeValue(e.target.value),
                      })
                    }
                    className={cx(
                      "h-fit ",
                      showEmailError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    )}
                  />
                </TooltipTrigger>
                {showEmailError && (
                  <TooltipContent>
                    {emailMissing
                      ? "Email is required"
                      : "Invalid email format"}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-[max-content_1fr] gap-4 items-center">
              <Label for="phone">Phone :</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    placeholder="Vendor Phone"
                    type="tel"
                    id="phone"
                    value={v.phone}
                    onChange={(e) =>
                      onChange({
                        ...v,
                        phone: normalizeValue(e.target.value),
                      })
                    }
                    className={cx(
                      "h-fit ",
                      showEmailError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    )}
                  />
                </TooltipTrigger>
                {showPhoneError && (
                  <TooltipContent>
                    {phoneMissing
                      ? "Phone number is required"
                      : "Invalid phone number"}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="text-sm">
          <div className="text-sm">Vendor ID: {v.vendor.vendorId}</div>
          <div>{v.vendor.address}</div>
          <div>
            {v.vendor.city}, {v.vendor.state}
          </div>
          <div className="font-medium">GST: {v.vendor.gst}</div>
        </div>

        {/* Contacts */}
        {v.contacts.length > 0 && (
          <div className="md:col-span-2">
            <div className="font-semibold mb-2">Contact Persons</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {v.contacts.map((c, i) => {
                const contactEmail = normalizeValue(c.email);
                const contactPhone = normalizeValue(c.phone);

                const missingEmail = requireEmail && !contactEmail;
                const missingPhone = requirePhone && !contactPhone;

                const hasIssue = missingEmail || missingPhone;

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() =>
                          onChange({
                            ...v,
                            email: contactEmail || v.email,
                            phone: contactPhone || v.phone,
                            selectedContactIndex: i,
                          })
                        }
                        className={`border rounded-md flex text-sm gap-4 justify-between p-2 cursor-pointer transition
                          ${
                            v.selectedContactIndex === i
                              ? "border-indigo-600 bg-indigo-50"
                              : hasIssue
                              ? "border-red-400 bg-red-50"
                              : "hover:border-muted-foreground"
                          }`}
                      >
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div>{c.designation}</div>
                        </div>
                        <div>
                          <div className="text-right">{c.email || "-"}</div>
                          <div className="text-right">{c.phone || "-"}</div>
                        </div>
                      </div>
                    </TooltipTrigger>

                    {hasIssue && (
                      <TooltipContent>
                        {missingEmail && missingPhone
                          ? "Email & Phone missing"
                          : missingEmail
                          ? "Email missing"
                          : "Phone missing"}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {v.items.map((i, idx) => (
          <div key={i.itemId} className="border rounded-md p-3">
            <div className="flex gap-2 items-center">
              <div className="px-3 py-1 bg-indigo-600 text-white rounded">
                {idx + 1}
              </div>
              <div>
                <div className="font-semibold">{i.description}</div>
                <div className="text-xs text-muted-foreground">
                  {i.categoryName} › {i.subCategoryName}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <Input value={i.qty} disabled />
              <Textarea value={i.customDescription} disabled />
            </div>

            {i.files && i.files.length > 0 && (
              <div className="flex flex-col gap-0.5 ml-1">
                {i.files.map((f, idx) => (
                  <div
                    key={idx}
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
        ))}
      </div>
    </div>
  );
}
