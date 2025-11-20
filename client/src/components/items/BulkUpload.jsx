// src/components/items/BulkUpload.jsx
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkUpload({
  categories,
  subcategories,
  uoms,
  createCategory,
  createSubCategory,
  createUom,
  queryClient,
  onItemsLoaded,
  onOpenChange,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [localSubcategories, setLocalSubcategories] = useState(subcategories);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Category", "Subcategory", "Description", "UOM"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "items_template.xlsx");
  };

  const checkNeedsConfirmation = (data) => {
    if (!data.length)
      return {
        needsConfirmation: false,
        missingCats: [],
        missingUoms: [],
        missingSubs: [],
      };

    const catMap = new Map(
      categories.map((c) => [c.name.toLowerCase().trim(), c.categoryId])
    );
    const uomMap = new Map(
      uoms.map((u) => [u.name.toLowerCase().trim(), u.uomId])
    );

    // unique category names in file
    const uniqueCats = [
      ...new Set(data.map((row) => row[0]?.toString().trim()).filter(Boolean)),
    ];
    const missingCats = uniqueCats.filter(
      (name) => !catMap.has(name.toLowerCase().trim())
    );

    // unique uom names in file
    const uniqueUomsList = [
      ...new Set(data.map((row) => row[3]?.toString().trim()).filter(Boolean)),
    ];
    const missingUoms = uniqueUomsList.filter(
      (name) => !uomMap.has(name.toLowerCase().trim())
    );

    // For subcategories, we follow Option A (strict):
    // - if the category exists (either in DB or will be created later), and the subcategory does not exist for that category, mark missing.
    // Note: if category is completely missing (not in DB), we still record the sub in missingSubs because category will be created first and then sub can be created.
    const missingSubs = [];
    const catNameToIdLower = new Map(
      categories.map((c) => [c.name.toLowerCase().trim(), c.categoryId])
    );

    for (const row of data) {
      const catName = row[0]?.toString().trim();
      const subName = row[1]?.toString().trim();
      if (!catName || !subName) continue;

      const catLower = catName.toLowerCase();
      const subLower = subName.toLowerCase();

      // if category exists, check if sub exists under that category
      const catId = catNameToIdLower.get(catLower);
      if (catId) {
        const hasSub = subcategories.some(
          (s) =>
            s.categoryId === catId && s.name.toLowerCase().trim() === subLower
        );
        if (!hasSub) {
          // missing sub under an existing category
          // add to missingSubs (avoid duplicates)
          if (
            !missingSubs.some(
              (ms) =>
                ms.categoryName.toLowerCase() === catLower &&
                ms.subName.toLowerCase() === subLower
            )
          ) {
            missingSubs.push({ categoryName: catName, subName });
          }
        }
      } else {
        // category doesn't exist - we will create category later, but sub will then need creation as well
        // add to missingSubs (avoid duplicates)
        if (
          !missingSubs.some(
            (ms) =>
              ms.categoryName.toLowerCase() === catLower &&
              ms.subName.toLowerCase() === subLower
          )
        ) {
          missingSubs.push({ categoryName: catName, subName });
        }
      }
    }

    return {
      needsConfirmation:
        missingCats.length > 0 ||
        missingUoms.length > 0 ||
        missingSubs.length > 0,
      missingCats,
      missingUoms,
      missingSubs,
    };
  };

  const buildItemsWithoutCreation = (data, catMap, uomMap) => {
    const items = [];
    for (const row of data) {
      let catName = row[0];
      let subName = row[1];
      let desc = row[2];
      let uomStr = row[3];
      if (!catName || !desc || !uomStr) continue;

      catName = catName.toString().trim();
      subName = subName ? subName.toString().trim() : "";
      desc = desc.toString().trim();
      uomStr = uomStr.toString().trim();

      const catLower = catName.toLowerCase();
      const catId = catMap.get(catLower);
      if (!catId) continue;

      let subId = "";
      if (subName) {
        const subLower = subName.toLowerCase();
        const existingSubsForCat = subcategories.filter(
          (s) => s.categoryId === catId
        );
        const subMap = new Map(
          existingSubsForCat.map((s) => [
            s.name.toLowerCase().trim(),
            s.subCategoryId,
          ])
        );
        subId = subMap.get(subLower);
        if (!subId) continue;
      }

      const uomLower = uomStr.toLowerCase();
      const uomId = uomMap.get(uomLower);
      if (!uomId) continue;

      items.push({
        categoryId: catId,
        subCategoryId: subId,
        description: desc,
        uom: uomId,
      });
    }
    return items;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "arraybuffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const data = jsonData.slice(1); // Skip header

      if (!data.length) {
        toast.warning("No data in the file.");
        return;
      }

      const { needsConfirmation, missingCats, missingUoms, missingSubs } =
        checkNeedsConfirmation(data);

      if (!needsConfirmation) {
        const catMap = new Map(
          categories.map((c) => [c.name.toLowerCase().trim(), c.categoryId])
        );
        const uomMap = new Map(
          uoms.map((u) => [u.name.toLowerCase().trim(), u.uomId])
        );
        const items = buildItemsWithoutCreation(data, catMap, uomMap);

        if (items.length === 0) {
          toast.warning("No valid items to upload.");
          return;
        }

        onItemsLoaded(items);
      } else {
        // Save pending data including missingSubs so confirm flow can create subs
        setPendingData({ data, missingCats, missingUoms, missingSubs });
        setShowConfirmDialog(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);

    try {
      const {
        data,
        missingCats = [],
        missingUoms = [],
        missingSubs = [],
      } = pendingData || {};

      //-----------------------------------------
      // 0) Build initial maps (names → IDs)
      //-----------------------------------------
      let catMap = new Map(
        (queryClient.getQueryData(["categories"]) || categories).map((c) => [
          c.name.toLowerCase().trim(),
          String(c.categoryId),
        ])
      );

      let uomMap = new Map(
        (queryClient.getQueryData(["uoms"]) || uoms).map((u) => [
          u.name.toLowerCase().trim(),
          String(u.uomId),
        ])
      );

      //-----------------------------------------
      // 1) Create missing categories
      //-----------------------------------------
      for (const origName of missingCats) {
        const cleaned = origName.trim(); // Keep original case
        const cleanedLower = cleaned.toLowerCase(); // Lookup only

        if (catMap.has(cleanedLower)) continue;

        const newCat = await createCategory.mutateAsync({ name: cleaned });
        await queryClient.refetchQueries({ queryKey: ["categories"] });

        catMap.set(cleanedLower, String(newCat.categoryId));
      }

      //-----------------------------------------
      // 2) Create missing UOMs
      //-----------------------------------------
      for (const origName of missingUoms) {
        const cleaned = origName.trim();
        const cleanedLower = cleaned.toLowerCase();

        if (uomMap.has(cleanedLower)) continue;

        const newUom = await createUom.mutateAsync({ name: cleaned });
        await queryClient.refetchQueries({ queryKey: ["uoms"] });

        uomMap.set(cleanedLower, String(newUom.uomId));
      }

      //-----------------------------------------
      // 3) Refresh subcategories BEFORE creating missing subs
      //-----------------------------------------
      await queryClient.refetchQueries({ queryKey: ["subcategories"] });

      let updatedSubs = (queryClient.getQueryData(["subcategories"]) || []).map(
        (s) => ({
          ...s,
          categoryId: String(s.categoryId),
          subCategoryId: String(s.subCategoryId),
          nameLower: s.name.toLowerCase().trim(),
        })
      );

      setLocalSubcategories(updatedSubs);

      //-----------------------------------------
      // 4) Create missing subcategories
      //-----------------------------------------
      for (const ms of missingSubs) {
        const categoryName = ms.categoryName.trim();
        const subName = ms.subName.trim();

        const catId = catMap.get(categoryName.toLowerCase());
        if (!catId) continue;

        const subLower = subName.toLowerCase();

        const exists = updatedSubs.some(
          (s) =>
            s.categoryId === String(catId) &&
            s.name.toLowerCase().trim() === subLower
        );
        if (exists) continue;

        const newSub = await createSubCategory.mutateAsync({
          categoryId: String(catId),
          name: subName, // <-- Keep original case
        });

        await queryClient.refetchQueries({ queryKey: ["subcategories"] });

        updatedSubs = (queryClient.getQueryData(["subcategories"]) || []).map(
          (s) => ({
            ...s,
            categoryId: String(s.categoryId),
            subCategoryId: String(s.subCategoryId),
            nameLower: s.name.toLowerCase().trim(),
          })
        );
      }

      //-----------------------------------------
      // 5) Refresh maps again (final definitive lists)
      //-----------------------------------------
      await queryClient.refetchQueries({ queryKey: ["categories"] });
      await queryClient.refetchQueries({ queryKey: ["uoms"] });
      await queryClient.refetchQueries({ queryKey: ["subcategories"] });

      const finalCats = queryClient.getQueryData(["categories"]) || categories;
      const finalUoms = queryClient.getQueryData(["uoms"]) || uoms;
      const finalSubsRaw =
        queryClient.getQueryData(["subcategories"]) || updatedSubs;

      // final maps
      catMap = new Map(
        finalCats.map((c) => [
          c.name.toLowerCase().trim(),
          String(c.categoryId),
        ])
      );

      uomMap = new Map(
        finalUoms.map((u) => [u.name.toLowerCase().trim(), String(u.uomId)])
      );

      // build subsByCat map: catId → (subNameLower → subCategoryId)
      const subsByCat = new Map();
      for (const s of finalSubsRaw) {
        const catIdStr = String(s.categoryId);
        const subIdStr = String(s.subCategoryId);
        const nameLower = s.name.toLowerCase().trim();

        const m = subsByCat.get(catIdStr) || new Map();
        m.set(nameLower, subIdStr);
        subsByCat.set(catIdStr, m);
      }

      //-----------------------------------------
      // 6) BUILD FINAL ITEMS ARRAY
      //-----------------------------------------
      const items = [];

      for (const row of data) {
        let catName = row[0];
        let subName = row[1];
        let desc = row[2];
        let uomStr = row[3];

        if (!catName || !desc || !uomStr) continue;

        catName = String(catName).trim();
        subName = subName ? String(subName).trim() : "";
        desc = String(desc).trim();
        uomStr = String(uomStr).trim();

        const catLower = catName.toLowerCase();
        const subLower = subName.toLowerCase();
        const uomLower = uomStr.toLowerCase();

        const catId = catMap.get(catLower);
        if (!catId) continue;

        let subId = "";

        if (subName) {
          const mapForCat = subsByCat.get(String(catId));

          if (mapForCat && mapForCat.has(subLower)) {
            subId = mapForCat.get(subLower);
          } else {
            // create missing subcategory on the fly
            const newSub = await createSubCategory.mutateAsync({
              categoryId: String(catId),
              name: subName,
            });

            await queryClient.refetchQueries({ queryKey: ["subcategories"] });

            subId = String(newSub.subCategoryId);

            const mapNow = subsByCat.get(String(catId)) || new Map();
            mapNow.set(subLower, subId);
            subsByCat.set(String(catId), mapNow);
          }
        }

        const uomId = uomMap.get(uomLower);
        if (!uomId) continue;

        items.push({
          categoryId: String(catId),
          subCategoryId: subId ? String(subId) : "",
          description: desc,
          uomId: String(uomId),
        });
      }

      //-----------------------------------------
      // 7) Done
      //-----------------------------------------
      console.log("FINAL ITEMS:", items);

      if (items.length === 0) {
        toast.warning("No valid items to upload.");
        return;
      }

      onItemsLoaded(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setIsUploading(false);
      setPendingData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="space-y-4 w-full sm:max-w-xs p-4 border rounded-md">
          <Button
            onClick={downloadTemplate}
            className="w-full bg-green-700 hover:bg-green-800 text-white hover:text-white"
            disabled={isUploading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Excel Template
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full cursor-pointer"
            disabled={isUploading}
          />
        </div>
      </div>
      {isUploading && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processing...
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Button
          type="button"
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Creation</AlertDialogTitle>
            <AlertDialogDescription>
              There are some Categories, Sub Categories, or UOMs in this file
              that are not present in the Database. Would you like to create
              them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                setPendingData(null);
                toast.info("Upload cancelled.");
              }}
            >
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              Yes, Create Them
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
