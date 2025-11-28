// src/components/items/EditItemForm.jsx
import React, { useEffect, useMemo, useRef } from "react";

import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { useUpdateItem } from "../../hooks/useItems";
import {
  useItemVendorMappings,
  useSaveItemVendorMappings,
} from "../../hooks/useItems";
import { useCategories, useSubCategories } from "../../hooks/useCategories";
import { useUoms } from "../../hooks/useUoms";
import { useVendors } from "../../hooks/useVendors";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";

import VendorMappingRow from "../vendors/VendorMappingRow";
import LoadingSpinner from "../common/LoadingSpinner";
import { customSelectStyles } from "../../utils/customSelectStyles.js";
import { cx } from "class-variance-authority";

// ------------------
// ZOD SCHEMA
// ------------------
const mappingSchema = z.object({
  mappingId: z.string().nullable().optional(),
  vendorId: z.string().min(1, "Vendor required"),
  price: z.string().optional(),
  uom: z.string().optional(),
  leadTimeDays: z.string().optional(),
  notes: z.string().optional(),
  deleted: z.boolean().optional().default(false),
});

const editItemSchema = z.object({
  categoryId: z.string().min(1, "Required"),
  subCategoryId: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  uomId: z.string().min(1, "Required"),
  mappings: z.array(mappingSchema),
});

// ------------------
// COMPONENT
// ------------------
export default function EditItemForm({ open, setOpen, item }) {
  const initializedRef = useRef(false);

  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();
  const { data: vendors = [] } = useVendors();
  const { data: initialMappings = null } = useItemVendorMappings(item?.itemId);

  const updateItem = useUpdateItem();
  const saveMappings = useSaveItemVendorMappings(item?.itemId);

  // ----------------------
  // RHF SETUP
  // ----------------------
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      categoryId: "",
      subCategoryId: "",
      description: "",
      uomId: "",
      mappings: [],
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "mappings",
  });

  // --------------------------------
  // Load initial form values + mapping rows
  // --------------------------------
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }

    if (!initialMappings) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    reset({
      categoryId: String(item.categoryId),
      subCategoryId: String(item.subCategoryId),
      description: item.description,
      uomId: String(item.uomId),
      mappings: initialMappings.map((m) => ({
        mappingId: m.mappingId,
        vendorId: String(m.vendorId || ""),
        price: m.price || "",
        uom: m.uom || "",
        leadTimeDays: m.leadTimeDays || "",
        notes: m.notes || "",
        deleted: false,
      })),
    });
  }, [open, initialMappings, reset, item]);

  // ---------------------
  // OPTIONS
  // ---------------------
  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({ label: c.name, value: String(c.categoryId) })),
    [categories]
  );

  const categoryId = watch("categoryId");

  const subCategoryOptions = useMemo(
    () =>
      subcategories
        .filter((s) => String(s.categoryId) === categoryId)
        .map((s) => ({
          label: s.name,
          value: String(s.subCategoryId),
        })),
    [subcategories, categoryId]
  );

  const uomOptions = useMemo(
    () => uoms.map((u) => ({ label: u.name, value: String(u.uomId) })),
    [uoms]
  );

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        value: String(v.vendorId),
        label:
          [v.vendorId, v.name, v.gst].filter(Boolean).join(" — ") ||
          "Search Vendor",
      })),
    [vendors]
  );

  const vendorUomOptions = useMemo(
    () => uoms.map((u) => ({ label: u.name, value: u.name })),
    [uoms]
  );

  // ---------------------
  // ADD MAPPING ROW
  // ---------------------
  const addVendorRow = () => {
    append({
      mappingId: null,
      vendorId: "",
      price: "",
      uom: "",
      leadTimeDays: "",
      notes: "",
      deleted: false,
    });
  };

  // ---------------------
  // UPDATE / DELETE / UNDO ROWS
  // ---------------------
  const updateRow = (index, key, value) => {
    setValue(`mappings.${index}.${key}`, value, { shouldDirty: true });
  };

  const markDeleted = (index) => {
    const row = watch(`mappings.${index}`);

    // If this is a brand new (unsaved) row → remove it directly
    if (!row.mappingId) {
      remove(index);
      return;
    }

    // If this row exists in DB → mark as deleted
    setValue(`mappings.${index}.deleted`, true, { shouldDirty: true });
  };

  const undoDelete = (index) => {
    setValue(`mappings.${index}.deleted`, false, { shouldDirty: true });
  };

  // ---------------------
  // PAYLOAD BUILDING
  // ---------------------
  const buildPayload = () => {
    return watch("mappings").map((m) => {
      const original = initialMappings?.find(
        (o) => o.mappingId === m.mappingId
      );

      console.log(!m.mappingId && !m.deleted);
      if (!m.mappingId && !m.deleted)
        return { ...m, itemId: item.itemId, _action: "add" };

      console.log(m.mappingId && m.deleted);
      if (m.mappingId && m.deleted)
        return { ...m, itemId: item.itemId, _action: "delete" };

      console.log(original);
      if (original) {
        const changed =
          original.vendorId != m.vendorId ||
          original.price != m.price ||
          original.uom != m.uom ||
          original.leadTimeDays != m.leadTimeDays ||
          original.notes != m.notes;

        return {
          ...m,
          itemId: item.itemId,
          _action: changed ? "update" : "keep",
        };
      }
    });
  };

  // ---------------------
  // SUBMIT HANDLER
  // ---------------------
  const onSubmit = async (data) => {
    const submittedItem = {
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      description: data.description,
      uomId: data.uomId,
    };

    // ORIGINAL ITEM VALUES FROM PROPS
    const originalItem = {
      categoryId: item.categoryId,
      subCategoryId: item.subCategoryId,
      description: item.description,
      uomId: item.uomId,
    };

    // CHECK IF ANY KEY IS CHANGED
    const isItemChanged = Object.keys(originalItem).some(
      (key) => originalItem[key] !== submittedItem[key]
    );

    try {
      // ------------------------------------------------
      // ONLY UPDATE ITEM IF THERE ARE ACTUAL CHANGES
      // ------------------------------------------------
      if (isItemChanged) {
        await updateItem.mutateAsync({
          id: item.itemId,
          payload: submittedItem,
        });
      } else {
        console.log("🟡 No item field changes detected. Skipping item update.");
      }

      // ------------------------------------------------
      // MAPPINGS ALWAYS NEED PROCESSING
      // ------------------------------------------------
      const payload = buildPayload();
      const filtered = payload.filter((p) => p._action !== "keep");

      await saveMappings.mutateAsync(filtered);

      toast.success("Item updated successfully");
      setOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-11/12 sm:max-w-11/12">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        {!initializedRef.current ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ITEM DETAILS */}
            <Card className="p-0">
              <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 p-4">
                {/* Category */}
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select
                        options={categoryOptions}
                        value={categoryOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt ? opt.value : "")}
                        styles={customSelectStyles("36px")}
                      />
                    )}
                  />
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                {/* Sub Category */}
                <div className="space-y-1">
                  <Label>Sub Category</Label>
                  <Controller
                    control={control}
                    name="subCategoryId"
                    render={({ field }) => (
                      <Select
                        options={subCategoryOptions}
                        value={subCategoryOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt ? opt.value : "")}
                        styles={customSelectStyles("36px")}
                      />
                    )}
                  />
                  {errors.subCategoryId && (
                    <p className="text-red-500 text-sm">
                      {errors.subCategoryId.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <Label>Description</Label>
                  <Input {...register("description")} />
                  {errors.description && (
                    <p className="text-red-500 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* UOM */}
                <div className="space-y-1">
                  <Label>UOM</Label>
                  <Controller
                    control={control}
                    name="uomId"
                    render={({ field }) => (
                      <Select
                        options={uomOptions}
                        value={uomOptions.find((o) => o.value === field.value)}
                        onChange={(opt) => field.onChange(opt ? opt.value : "")}
                        styles={customSelectStyles("36px")}
                      />
                    )}
                  />
                  {errors.uomId && (
                    <p className="text-red-500 text-sm">
                      {errors.uomId.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* VENDOR MAPPING SECTION */}
            <Card className="p-0">
              <CardContent className="p-4">
                <div
                  className={cx(
                    "flex justify-between items-center",
                    fields.length > 0 && "mb-4"
                  )}
                >
                  <h3 className="font-semibold">Vendor Mappings</h3>
                  <Button type="button" onClick={addVendorRow}>
                    + Add Vendor
                  </Button>
                </div>

                {fields.length !== 0 && (
                  <div className="hidden sm:grid grid-cols-[repeat(8,1fr)_40px] py-2 text-sm bg-gray-200 rounded-md gap-4 sm:gap-2 font-medium mb-2">
                    <p className="pl-2 sm:col-span-3">Vendor</p>
                    <p className="pl-2">Rate</p>
                    <p className="pl-2">Uom (Per/-)</p>
                    <p className="pl-2">Lead Days</p>
                    <p className="pl-2 sm:col-span-2">Notes</p>
                    <p></p>
                  </div>
                )}

                {fields.map((row, idx) => (
                  <VendorMappingRow
                    key={row.id}
                    index={idx}
                    control={control}
                    register={register}
                    watch={watch}
                    updateRow={updateRow}
                    markDeleted={markDeleted}
                    undoDelete={undoDelete}
                    vendorOptions={vendorOptions}
                    uomOptions={vendorUomOptions}
                    errors={errors}
                  />
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" className="bg-indigo-600 text-white">
                {(updateItem.isPending || saveMappings.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
