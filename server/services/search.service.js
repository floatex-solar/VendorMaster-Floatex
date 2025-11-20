import { getValues } from "../lib/google-sheets.js";

export async function searchItemVendors({
  keyword,
  categoryId,
  subCategoryId,
}) {
  keyword = (keyword || "").trim().toLowerCase();
  categoryId = categoryId?.trim();
  subCategoryId = subCategoryId?.trim();

  // Load all sheets in parallel (fast)
  const [
    itemsRows,
    vendorRows,
    contactRows,
    mappingRows,
    categoryRows,
    subCategoryRows,
    uomRows,
  ] = await Promise.all([
    getValues("Items!A:H"),
    getValues("Vendors!A:L"),
    getValues("VendorContacts!A:H"),
    getValues("VendorItemsMapping!A:H"),
    getValues("Categories!A:E"),
    getValues("SubCategories!A:F"),
    getValues("UOMs!A:D"),
  ]);

  const items = itemsRows.slice(1);
  const vendors = vendorRows.slice(1);
  const contacts = contactRows.slice(1);
  const mappings = mappingRows.slice(1);
  const categories = categoryRows.slice(1);
  const subCats = subCategoryRows.slice(1);
  const uoms = uomRows.slice(1);

  // Category lookup
  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c[0]] = c[1]; // CAT-ID → Category Name
  });

  // Subcategory lookup
  const subCategoryMap = {};
  subCats.forEach((sc) => {
    subCategoryMap[sc[0]] = {
      name: sc[2],
      categoryId: sc[1],
    };
  });

  // UOM lookup: UOM-ID → UOM Name
  const uomMap = {};
  uoms.forEach((u) => {
    uomMap[u[0]] = u[1];
  });

  // 🟦 MATCH ITEMS BY: Description OR Category OR SubCategory OR UOM
  const matchedItems = items
    .filter((r) => {
      const itemCategoryId = r[1];
      const itemSubCategoryId = r[2];

      // Apply category filter if provided
      if (categoryId && itemCategoryId !== categoryId) {
        return false;
      }

      // Apply subcategory filter if provided
      if (subCategoryId && itemSubCategoryId !== subCategoryId) {
        return false;
      }

      const desc = r[3]?.toLowerCase() || "";
      const catName = categoryMap[itemCategoryId]?.toLowerCase() || "";
      const subName =
        subCategoryMap[itemSubCategoryId]?.name?.toLowerCase() || "";
      const uomName = uomMap[r[4]]?.toLowerCase() || "";

      // Match keyword
      return (
        !keyword ||
        desc.includes(keyword) ||
        catName.includes(keyword) ||
        subName.includes(keyword) ||
        uomName.includes(keyword)
      );
    })
    .map((r) => ({
      itemId: r[0],
      categoryId: r[1],
      categoryName: categoryMap[r[1]] || "",
      subCategoryId: r[2],
      subCategoryName: subCategoryMap[r[2]]?.name || "",
      description: r[3],
      uomId: r[4],
      uomName: uomMap[r[4]] || "",
    }));

  if (matchedItems.length === 0) return [];

  // For fast lookup
  const itemMap = {};
  matchedItems.forEach((i) => (itemMap[i.itemId] = i));

  // Filter mapping rows for these items
  const matchedMappings = mappings
    .filter((m) => itemMap[m[2]] && m[7] !== "false")
    .map((m) => ({
      mappingId: m[0],
      vendorId: m[1],
      itemId: m[2],
      price: m[3],
      uom: m[4],
      leadTimeDays: m[5],
      notes: m[6],
    }));

  // Vendor lookup
  const vendorMap = {};
  vendors.forEach((v) => {
    if (v[11] !== "false") {
      vendorMap[v[0]] = {
        vendorId: v[0],
        name: v[1],
        address: v[2],
        state: v[3],
        city: v[4],
        pinCode: v[5],
        gst: v[6],
        phone: v[7],
        email: v[8],
      };
    }
  });

  // Contacts lookup
  const contactMap = {};
  contacts.forEach((c) => {
    if (c[7] === "false") return;
    if (!contactMap[c[1]]) contactMap[c[1]] = [];
    contactMap[c[1]].push({
      contactId: c[0],
      name: c[2],
      designation: c[3],
      phone: c[4],
      email: c[5],
      info: c[6],
    });
  });

  // Final combined result
  const result = [];

  for (const item of matchedItems) {
    const itemVendors = matchedMappings
      .filter((m) => m.itemId === item.itemId)
      .map((m) => ({
        vendor: vendorMap[m.vendorId],
        contacts: contactMap[m.vendorId] || [],
        mapping: m,
      }));

    result.push({
      item,
      vendors: itemVendors,
    });
  }

  return result;
}
