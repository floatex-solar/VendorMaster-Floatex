// src/components/items/EditItemForm.jsx
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateItem } from "../../hooks/useItems";
import {
  useCategories,
  useSubCategories,
  useCreateCategory,
  useCreateSubCategory,
} from "../../hooks/useCategories";
import { useUoms, useCreateUom } from "../../hooks/useUoms";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

const schema = z.object({
  categoryId: z.string().min(1, "Category required"),
  subCategoryId: z.string().min(1, "Sub Category required"),
  description: z.string().min(1, "Description required"),
  uomId: z.string().min(1, "UOM required"),
});

const customSelectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (provided) => ({
    ...provided,
    minHeight: "34px",
    height: "34px",
    borderColor: "oklch(0.922 0 0)",
    borderRadius: "0.375rem",
    boxShadow:
      "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 1px 2px 0 rgb(0 0 0 / 0.05)",
    fontSize: "0.875rem",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "34px",
    padding: "0 6px",
    fontSize: "0.875rem",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    padding: "6px 10px",
    backgroundColor: state.isFocused ? "oklch(0.97 0 0)" : "transparent",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "34px",
  }),
};

export default function EditItemForm({ item = null, open, setOpen }) {
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();
  const updateItem = useUpdateItem();
  const createCategory = useCreateCategory();
  const createSubCategory = useCreateSubCategory();
  const createUom = useCreateUom();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: "",
      subCategoryId: "",
      description: "",
      uomId: "",
    },
  });

  const watchedCategoryId = watch("categoryId");
  const watchedSubCategoryId = watch("subCategoryId");
  const watchedUomId = watch("uomId");

  // === CRITICAL FIX: Populate form every time dialog opens with an item ===
  useEffect(() => {
    if (!open || !item) {
      return;
    }

    setValue("categoryId", item.categoryId ? String(item.categoryId) : "");
    setValue(
      "subCategoryId",
      item.subCategoryId ? String(item.subCategoryId) : ""
    );
    setValue("description", item.description || "");
    setValue("uomId", item.uomId ? String(item.uomId) : "");
  }, [open, item, setValue]);

  // Clear subcategory when category changes (user manually changes it)
  useEffect(() => {
    if (
      watchedCategoryId &&
      item &&
      String(item.categoryId) !== watchedCategoryId
    ) {
      setValue("subCategoryId", "");
    }
  }, [watchedCategoryId, item, setValue]);

  // Reset form only after dialog is fully closed
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => reset(), 300); // small delay for smooth close
      return () => clearTimeout(timer);
    }
  }, [open, reset]);

  const catOptions = useMemo(
    () =>
      categories.map((c) => ({ value: String(c.categoryId), label: c.name })),
    [categories]
  );

  const subCatOptions = useMemo(
    () =>
      subcategories
        .filter((s) => String(s.categoryId) === watchedCategoryId)
        .map((s) => ({ value: String(s.subCategoryId), label: s.name })),
    [subcategories, watchedCategoryId]
  );

  const uomOptions = useMemo(
    () => uoms.map((u) => ({ value: String(u.uomId), label: u.name })),
    [uoms]
  );

  const categoryValue = useMemo(
    () => catOptions.find((opt) => opt.value === watchedCategoryId) || null,
    [catOptions, watchedCategoryId]
  );

  const subCategoryValue = useMemo(
    () =>
      subCatOptions.find((opt) => opt.value === watchedSubCategoryId) || null,
    [subCatOptions, watchedSubCategoryId]
  );

  const uomValue = useMemo(
    () => uomOptions.find((opt) => opt.value === watchedUomId) || null,
    [uomOptions, watchedUomId]
  );

  async function onSubmit(data) {
    try {
      await updateItem.mutateAsync({
        id: item.itemId,
        payload: {
          categoryId: Number(data.categoryId),
          subCategoryId: Number(data.subCategoryId),
          description: data.description.trim(),
          uomId: Number(data.uomId),
        },
      });
      toast.success("Item updated successfully");
      setOpen(false);
    } catch (e) {
      toast.error(e.message || "Failed to update item");
    }
  }

  const handleCreateCategory = async (inputValue) => {
    try {
      const newCat = await createCategory.mutateAsync({
        name: inputValue.trim(),
      });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setValue("categoryId", String(newCat.categoryId));
    } catch (e) {
      toast.error("Failed to create category");
    }
  };

  const handleCreateSubCategory = async (inputValue) => {
    if (!watchedCategoryId) {
      toast.warning("Please select a category first");
      return;
    }
    try {
      const newSub = await createSubCategory.mutateAsync({
        categoryId: Number(watchedCategoryId),
        name: inputValue.trim(),
      });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      setValue("subCategoryId", String(newSub.subCategoryId));
    } catch (e) {
      toast.error("Failed to create subcategory");
    }
  };

  const handleCreateUom = async (inputValue) => {
    try {
      const newUom = await createUom.mutateAsync({ name: inputValue.trim() });
      qc.invalidateQueries({ queryKey: ["uoms"] });
      setValue("uomId", String(newUom.uomId));
    } catch (e) {
      toast.error("Failed to create UOM");
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-11/12 sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">Edit Item</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          inert={updateItem.isPending ? "" : undefined}
        >
          <Card className="p-0 border-none shadow-none">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <CreatableSelect
                    options={catOptions}
                    value={categoryValue}
                    onChange={(opt) =>
                      setValue("categoryId", opt ? opt.value : "")
                    }
                    onCreateOption={handleCreateCategory}
                    formatCreateLabel={(v) => `Create "${v}"`}
                    placeholder="Select or create..."
                    isClearable
                    styles={customSelectStyles}
                    className="text-sm"
                    isDisabled={updateItem.isPending}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-red-500">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                {/* Sub Category */}
                <div className="space-y-2">
                  <Label>
                    Sub Category <span className="text-red-500">*</span>
                  </Label>
                  <CreatableSelect
                    options={subCatOptions}
                    value={subCategoryValue}
                    onChange={(opt) =>
                      setValue("subCategoryId", opt ? opt.value : "")
                    }
                    onCreateOption={handleCreateSubCategory}
                    formatCreateLabel={(v) => `Create "${v}"`}
                    placeholder={
                      watchedCategoryId
                        ? "Select or create..."
                        : "Select category first"
                    }
                    isClearable
                    isDisabled={!watchedCategoryId || updateItem.isPending}
                    styles={customSelectStyles}
                    className="text-sm"
                  />
                  {errors.subCategoryId && (
                    <p className="text-sm text-red-500">
                      {errors.subCategoryId.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("description")}
                    placeholder="Enter description"
                    disabled={updateItem.isPending}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* UOM */}
                <div className="space-y-2">
                  <Label>
                    UOM <span className="text-red-500">*</span>
                  </Label>
                  <CreatableSelect
                    options={uomOptions}
                    value={uomValue}
                    onChange={(opt) => setValue("uomId", opt ? opt.value : "")}
                    onCreateOption={handleCreateUom}
                    formatCreateLabel={(v) => `Create "${v}"`}
                    placeholder="Select or create UOM..."
                    isClearable
                    styles={customSelectStyles}
                    className="text-sm"
                    isDisabled={updateItem.isPending}
                  />
                  {errors.uomId && (
                    <p className="text-sm text-red-500">
                      {errors.uomId.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateItem.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateItem.isPending}
              className="text-white hover:text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {updateItem.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {updateItem.isPending ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
