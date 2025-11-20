// src/utils/exportToExcel.js
import * as XLSX from "xlsx";

/**
 * pinnedData: array of objects shaped like the search API results:
 * [
 *  { item: {...}, vendors: [ {...} ] },
 *  ...
 * ]
 */
export function exportVendorsToExcel(pinnedData) {
  // flatten to rows
  const rows = [];

  pinnedData.forEach(({ item, vendors }) => {
    vendors.forEach((vendor) => {
      const contactNames = (vendor.contacts || [])
        .map((c) => c.name)
        .join(", ");
      const contactPhones = (vendor.contacts || [])
        .map((c) => c.phone)
        .join(", ");
      const contactEmails = (vendor.contacts || [])
        .map((c) => c.email)
        .join(", ");

      rows.push({
        "Item ID": item.itemId || item.id || "",
        "Item Description": item.description || "",
        "Item UOM": item.uomName || item.uom || "",
        "Vendor ID": vendor.vendor?.vendorId || vendor.vendor_id || "",
        "Vendor Name": vendor.vendor?.name || vendor.name || "",
        City: vendor.vendor?.city || vendor.city || "",
        State: vendor.vendor?.state || vendor.state || "",
        GST: vendor.vendor?.gst || vendor.gst || "",
        "Vendor Phone": vendor.vendor?.phone || vendor.phone || "",
        "Vendor Email": vendor.vendor?.email || vendor.email || "",
        Price: vendor.mapping?.price || "",
        "Quote UOM": vendor.mapping?.uom || "",
        "Lead Time (Days)":
          vendor.mapping?.leadTimeDays || vendor.mapping?.lead_time_days || "",
        Notes: vendor.mapping?.notes || "",
        "Contact Persons": contactNames,
        "Contact Phones": contactPhones,
        "Contact Emails": contactEmails,
      });
    });
    // if no vendors, still push a row for the item (optional)
    if (!vendors || vendors.length === 0) {
      rows.push({
        "Item ID": item.itemId || item.id || "",
        "Item Description": item.description || "",
        "Item UOM": item.uomName || item.uom || "",
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pinned Vendor Results");

  const filename = `pinned-vendors-${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  XLSX.writeFile(workbook, filename);
}
