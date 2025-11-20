// src/components/items/ItemForm.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBulkCreateItem } from "../../hooks/useItems";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BulkUpload from "./BulkUpload";
import { customSelectStyles } from "../../utils/customSelectStyles";

const itemSchema = z.object({
  categoryId: z.string().min(1, "Category required"),
  subCategoryId: z.string().min(1, "Sub Category required"),
  description: z.string().min(1, "Description required"),
  uomId: z.string().min(1, "UOM required"),
});

const schema = z.object({
  items: z.array(itemSchema).min(1, "At least one item required"),
});

export default function ItemForm({ open, onOpenChange }) {
  const [showCatManager, setShowCatManager] = useState(false);
  const [showSubManager, setShowSubManager] = useState(false);
  const [mode, setMode] = useState("manual"); // "manual" or "bulk"
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();
  const bulkCreate = useBulkCreateItem();
  const createCategory = useCreateCategory();
  const createSubCategory = useCreateSubCategory();
  const createUom = useCreateUom();
  const qc = useQueryClient();

  // version increments whenever we want to force re-compute of memos/options
  const [version, setVersion] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [
        { categoryId: "", subCategoryId: "", description: "", uomId: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Build options from freshest available data in query cache or fall back to hook data.
  // Ensure IDs are strings everywhere (important to match watch() values).
  const categoriesForOptions = useMemo(() => {
    const cached = qc.getQueryData(["categories"]);
    const source = cached && cached.length ? cached : categories;
    return source.map((c) => ({ value: String(c.categoryId), label: c.name }));
    // re-run when categories data changes OR when version is bumped after refetch
  }, [categories, qc, version]);

  const uomsForOptions = useMemo(() => {
    const cached = qc.getQueryData(["uoms"]);
    const source = cached && cached.length ? cached : uoms;
    return source.map((u) => ({ value: String(u.uomId), label: u.name }));
  }, [uoms, qc, version]);

  // Note: we intentionally compute suboptions on demand in getFilteredSubOptions (live)
  // because subcategories are very dynamic after bulk upload.
  const catOptions = categoriesForOptions;
  const uomOptions = uomsForOptions;

  const handleCreateCategory = async (inputValue, fieldIndex) => {
    try {
      const newCat = await createCategory.mutateAsync({ name: inputValue });
      await qc.refetchQueries({ queryKey: ["categories"] });
      setVersion((v) => v + 1); // force re-compute of options
      setValue(`items.${fieldIndex}.categoryId`, String(newCat.categoryId));
      // clear subcategory when category changed/created
      setValue(`items.${fieldIndex}.subCategoryId`, "");
      return { value: String(newCat.categoryId), label: inputValue };
    } catch {
      toast.error("Failed to create category");
    }
  };

  const handleCreateSubCategory = async (inputValue, fieldIndex) => {
    const categoryId = watch(`items.${fieldIndex}.categoryId`);
    if (!categoryId) {
      toast.warning("Please select a category first");
      return;
    }
    try {
      // categoryId might be string already; ensure we pass correct type to API if needed
      const newSub = await createSubCategory.mutateAsync({
        categoryId,
        name: inputValue,
      });
      await qc.refetchQueries({ queryKey: ["subcategories"] });
      setVersion((v) => v + 1);
      setValue(
        `items.${fieldIndex}.subCategoryId`,
        String(newSub.subCategoryId)
      );
      return { value: String(newSub.subCategoryId), label: inputValue };
    } catch {
      toast.error("Failed to create subcategory");
    }
  };

  const handleCreateUom = async (inputValue, fieldIndex) => {
    try {
      const newUom = await createUom.mutateAsync({ name: inputValue });
      await qc.refetchQueries({ queryKey: ["uoms"] });
      setVersion((v) => v + 1);
      setValue(`items.${fieldIndex}.uomId`, String(newUom.uomId));
      return { value: String(newUom.uomId), label: inputValue };
    } catch {
      toast.error("Failed to create UOM");
    }
  };

  async function onSubmit(data) {
    try {
      // data.items already contains string IDs due to coercion on append
      await bulkCreate.mutateAsync(data.items);
      toast.success(`Created ${data.items.length} items successfully`);
      reset();
      if (mode === "manual") {
        onOpenChange(false);
      }
    } catch (e) {
      toast.error(e.message || "Failed");
    }
  }

  // Live filtered sub options that always reads latest cache
  const getFilteredSubOptions = (categoryId) => {
    if (!categoryId) return [];
    const subsCache = qc.getQueryData(["subcategories"]) || subcategories || [];
    // ensure comparison is string-based
    const catIdStr = String(categoryId);
    return subsCache
      .filter((s) => String(s.categoryId) === catIdStr)
      .map((s) => ({ value: String(s.subCategoryId), label: s.name }));
  };

  /**
   * handleItemsLoaded
   * - REFRESH queries
   * - bump version to recompute memoized option lists
   * - APPEND items with all IDs coerced to strings so CreatableSelect finds matching options
   */
  const handleItemsLoaded = async (items) => {
    try {
      // 1) REFRESH queries so cache has latest created categories/uoms/subs
      await Promise.all([
        qc.refetchQueries({ queryKey: ["categories"] }),
        qc.refetchQueries({ queryKey: ["uoms"] }),
        qc.refetchQueries({ queryKey: ["subcategories"] }),
      ]);

      // 2) bump version so useMemo recomputes options using fresh cache
      setVersion((v) => v + 1);

      // 3) reset form then append rows using string IDs
      reset({ items: [] });

      for (const item of items) {
        append({
          categoryId: item.categoryId ? String(item.categoryId) : "",
          subCategoryId: item.subCategoryId ? String(item.subCategoryId) : "",
          description: item.description || "",
          uomId: item.uomId ? String(item.uomId) : "",
        });
      }

      setMode("manual");
      toast.success(
        `${items.length} items loaded for review in the manual tab.`
      );
    } catch (err) {
      console.error("Error loading items into manual tab:", err);

      // Defensive fallback: append anyway but coerce IDs to strings
      reset({ items: [] });
      for (const item of items) {
        append({
          categoryId: item.categoryId ? String(item.categoryId) : "",
          subCategoryId: item.subCategoryId ? String(item.subCategoryId) : "",
          description: item.description || "",
          uomId: item.uomId ? String(item.uomId) : "",
        });
      }
      setMode("manual");
      toast.success(`${items.length} items loaded for review (partial).`);
    }
  };

  useEffect(() => {
    // Reset when dialog closes; do not force mode changes on open so user can choose tab
    if (!open) {
      reset();
      setMode("manual");
    }
  }, [open, reset]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-11/12 sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-indigo-600">Add Items</DialogTitle>
            <DialogDescription>
              Add multiple items manually or via bulk upload.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={mode} onValueChange={setMode} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="manual">Manual Add</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-2"
              >
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[repeat(4,1fr)_40px] text-sm gap-4 sm:gap-2 bg-gray-200 py-2 rounded-md">
                  <p className="pl-2">
                    Category <span className="text-red-500">*</span>
                  </p>
                  <p className="pl-2">
                    Sub Category <span className="text-red-500">*</span>
                  </p>
                  <p className="pl-2">
                    Item Description <span className="text-red-500">*</span>
                  </p>
                  <p className="pl-2">
                    Uom <span className="text-red-500">*</span>
                  </p>
                  <p className="pl-2 hidden sm:block text-right"></p>
                </div>

                <div className="space-y-4 sm:space-y-2">
                  {fields.map((field, index) => (
                    <Card
                      key={field.id}
                      className="p-0 sm:border-none sm:shadow-none"
                    >
                      <CardContent className="p-4 sm:p-0">
                        <div className="flex sm:hidden justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold">
                            Item {index + 1}
                          </h4>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={bulkCreate.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[repeat(4,1fr)_40px] gap-4 sm:gap-2">
                          <div className="space-y-2">
                            <Label
                              htmlFor={`items.${index}.categoryId`}
                              className="sm:hidden"
                            >
                              Category <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <CreatableSelect
                                options={catOptions}
                                value={catOptions.find(
                                  (opt) =>
                                    opt.value ===
                                    watch(`items.${index}.categoryId`)
                                )}
                                onChange={(opt) => {
                                  setValue(
                                    `items.${index}.categoryId`,
                                    opt ? String(opt.value) : ""
                                  );
                                  // CLEAR SUBCATEGORY WHEN CATEGORY CHANGES
                                  setValue(`items.${index}.subCategoryId`, "");
                                }}
                                onCreateOption={(inputValue) =>
                                  handleCreateCategory(inputValue, index)
                                }
                                formatCreateLabel={(input) =>
                                  `Create "${input}"`
                                }
                                placeholder="Select category..."
                                isClearable
                                className="flex-1 text-xs md:text-sm"
                                classNamePrefix="react-select"
                                styles={customSelectStyles()}
                                isDisabled={bulkCreate.isPending}
                              />
                            </div>
                            {errors.items?.[index]?.categoryId && (
                              <p className="text-sm text-red-500">
                                {errors.items[index].categoryId.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`items.${index}.subCategoryId`}
                              className="sm:hidden"
                            >
                              Sub Category{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <CreatableSelect
                                options={getFilteredSubOptions(
                                  watch(`items.${index}.categoryId`)
                                )}
                                value={
                                  watch(`items.${index}.subCategoryId`)
                                    ? getFilteredSubOptions(
                                        watch(`items.${index}.categoryId`)
                                      ).find(
                                        (opt) =>
                                          opt.value ===
                                          watch(`items.${index}.subCategoryId`)
                                      )
                                    : null
                                }
                                onChange={(opt) =>
                                  setValue(
                                    `items.${index}.subCategoryId`,
                                    opt ? String(opt.value) : ""
                                  )
                                }
                                onCreateOption={(inputValue) =>
                                  handleCreateSubCategory(inputValue, index)
                                }
                                formatCreateLabel={(input) =>
                                  `Create "${input}"`
                                }
                                placeholder={
                                  watch(`items.${index}.categoryId`)
                                    ? "Select subcategory..."
                                    : "Select category first"
                                }
                                isClearable
                                isDisabled={!watch(`items.${index}.categoryId`)}
                                className="flex-1 text-xs md:text-sm"
                                classNamePrefix="react-select"
                                styles={customSelectStyles()}
                                disabled={bulkCreate.isPending}
                              />
                            </div>
                            {errors.items?.[index]?.subCategoryId && (
                              <p className="text-sm text-red-500">
                                {errors.items[index].subCategoryId.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`items.${index}.description`}
                              className="sm:hidden"
                            >
                              Description{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              {...register(`items.${index}.description`)}
                              placeholder="Enter item description"
                              disabled={bulkCreate.isPending}
                            />
                            {errors.items?.[index]?.description && (
                              <p className="text-sm text-red-500">
                                {errors.items[index].description.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`items.${index}.uomId`}
                              className="sm:hidden"
                            >
                              UOM <span className="text-red-500">*</span>
                            </Label>
                            <CreatableSelect
                              options={uomOptions}
                              value={
                                watch(`items.${index}.uomId`)
                                  ? uomOptions.find(
                                      (opt) =>
                                        opt.value ===
                                        watch(`items.${index}.uomId`)
                                    )
                                  : null
                              }
                              onChange={(opt) =>
                                setValue(
                                  `items.${index}.uomId`,
                                  opt ? String(opt.value) : ""
                                )
                              }
                              onCreateOption={(inputValue) =>
                                handleCreateUom(inputValue, index)
                              }
                              formatCreateLabel={(input) => `Create "${input}"`}
                              placeholder="Select UOM..."
                              isClearable
                              className="flex-1 text-xs md:text-sm"
                              classNamePrefix="react-select"
                              styles={customSelectStyles()}
                              isDisabled={bulkCreate.isPending}
                            />
                            {errors.items?.[index]?.uomId && (
                              <p className="text-sm text-red-500">
                                {errors.items[index].uomId.message}
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center justify-end">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={bulkCreate.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {errors.items &&
                    typeof errors.items === "object" &&
                    "message" in errors.items && (
                      <p className="text-sm text-red-500">
                        {errors.items.message}
                      </p>
                    )}
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        categoryId: "",
                        subCategoryId: "",
                        description: "",
                        uomId: "",
                      })
                    }
                    className="bg-gray-600 hover:bg-gray-700 hover:text-white text-white"
                    disabled={bulkCreate.isPending}
                  >
                    + Add
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={bulkCreate.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={bulkCreate.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white"
                    >
                      {bulkCreate.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {bulkCreate.isPending ? "Creating..." : "Create "}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="bulk" className="mt-4">
              <BulkUpload
                categories={categories}
                subcategories={subcategories}
                uoms={uoms}
                createCategory={createCategory}
                createSubCategory={createSubCategory}
                createUom={createUom}
                queryClient={qc}
                onItemsLoaded={handleItemsLoaded}
                onOpenChange={onOpenChange}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
