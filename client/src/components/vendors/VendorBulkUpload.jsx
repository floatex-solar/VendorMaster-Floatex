// src/components/vendors/VendorBulkUpload.jsx
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

//
//  UPDATED HEADERS (INCLUDES DESIGNATION)
//
const HEADERS = [
  "Vendor Name",
  "Address",
  "State",
  "City",
  "PinCode",
  "Gst",
  "Phone",
  "Email",

  "Contact Person Name",
  "Contact Person Designation",
  "Contact Person Phone",
  "Contact Person Email",
  "Contact Person Info",
];

export default function VendorBulkUpload({ onVendorsLoaded, onOpenChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ------------------------------
  // DOWNLOAD TEMPLATE
  // ------------------------------
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "vendors_template.xlsx");
  };

  // ------------------------------
  // GROUP ROWS BY UNIQUE VENDOR
  // ------------------------------
  const groupVendors = (rows) => {
    const vendorGroups = new Map();

    const vendorKey = (v) =>
      `${v.name?.trim() || ""}|${v.address?.trim() || ""}|${
        v.gst?.trim() || ""
      }|${v.phone?.trim() || ""}|${v.email?.trim() || ""}`;

    for (const row of rows) {
      if (!row[0]) continue;

      const vendor = {
        name: row[0]?.toString().trim(),
        address: row[1]?.toString().trim(),
        state: row[2]?.toString().trim(),
        city: row[3]?.toString().trim(),
        pinCode: row[4]?.toString().trim(),
        gst: row[5]?.toString().trim(),
        phone: row[6]?.toString().trim(),
        email: row[7]?.toString().trim(),
        active: true,
      };

      const key = vendorKey(vendor);

      if (!vendorGroups.has(key)) {
        vendorGroups.set(key, { vendor, contacts: [] });
      }

      const contactName = row[8]?.toString().trim();

      if (contactName) {
        vendorGroups.get(key).contacts.push({
          name: contactName,
          designation: row[9]?.toString().trim() || "",
          phone: row[10]?.toString().trim() || "",
          email: row[11]?.toString().trim() || "",
          info: row[12]?.toString().trim() || "",
        });
      }
    }

    return Array.from(vendorGroups.values()).map((group) => ({
      vendor: group.vendor,
      contacts: group.contacts,
      mappings: [], // bulk upload does not include mappings
    }));
  };

  // ------------------------------
  // HANDLE FILE UPLOAD
  // ------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "arraybuffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const rows = json.slice(1);

      if (!rows.length) {
        toast.warning("No data found in file.");
        return;
      }

      const vendorsData = groupVendors(rows);

      if (!vendorsData.length) {
        toast.warning("No valid vendor data found.");
        return;
      }

      // 🔥 SEND DATA TO MANUAL TAB
      onVendorsLoaded(vendorsData);

      toast.success(
        `${vendorsData.length} vendors loaded into Manual Add tab.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error processing file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ------------------------------
  // RENDER UI
  // ------------------------------
  return (
    <>
      <div className="flex items-center justify-center">
        <div className="space-y-4 w-full sm:max-w-xs p-4 border rounded-md">
          <Button
            onClick={downloadTemplate}
            className="w-full bg-green-700 hover:bg-green-800 text-white hover:text-white"
            disabled={isUploading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Excel Template
          </Button>

          <Input
            ref={fileInputRef}
            type="file"
            className="w-full cursor-pointer"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.value = "";
            onOpenChange(false);
          }}
          disabled={isUploading}
        >
          Close
        </Button>
      </div>
    </>
  );
}
