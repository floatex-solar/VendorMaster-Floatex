// src/components/vendors/VendorForm.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateVendor } from "../../hooks/useVendors";
import { useItems } from "../../hooks/useItems"; // Reuse items hooks
import { useCategories, useSubCategories } from "../../hooks/useCategories";
import { useUoms } from "../../hooks/useUoms";
import Select from "react-select";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2, Plus, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import VendorBulkUpload from "./VendorBulkUpload";
import { State, City } from "country-state-city";
import VendorContactsSection from "./VendorContactsSection";
import VendorMappingsSection from "./VendorMappingsSection";
import { cx } from "class-variance-authority";

const { getStatesOfCountry } = State;
const { getCitiesOfState } = City;

const vendorSchema = z.object({
  name: z.string().min(1, "Name required"),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pinCode: z.string().optional(),
  gst: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  active: z.boolean().default(true),
});

const contactSchema = z.object({
  name: z.string().min(1, "Contact name required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  info: z.string().optional(),
});

const mappingSchema = z.object({
  itemId: z.string().min(1, "Item required"),
  price: z.string().optional(),
  uom: z.string().optional(),
  leadTimeDays: z.string().optional(),
  notes: z.string().optional(),
});

const singleVendorSchema = z.object({
  vendor: vendorSchema,
  contacts: z.array(contactSchema).optional(),
  mappings: z.array(mappingSchema).optional(),
});

const schema = z.object({
  vendors: z.array(singleVendorSchema).min(1, "At least one vendor required"),
});

const customSelectStyles = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
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

export default function VendorForm({ open, onOpenChange }) {
  const [mode, setMode] = useState("manual");
  const createVendor = useCreateVendor();
  const qc = useQueryClient();
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();
  const [hiddenVendorSections, setHiddenVendorSections] = useState([]);

  const handleHideSection = (vendorIndex) => {
    setHiddenVendorSections(
      (prev) =>
        prev.includes(vendorIndex)
          ? prev.filter((i) => i !== vendorIndex) // remove
          : [...prev, vendorIndex] // add
    );
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      vendors: [
        {
          vendor: {
            name: "",
            address: "",
            state: "",
            city: "",
            pinCode: "",
            gst: "",
            phone: "",
            email: "",
            active: true,
          },
          contacts: [],
          mappings: [],
        },
      ],
    },
  });

  const {
    fields: vendorFields,
    append: appendVendor,
    remove: removeVendor,
  } = useFieldArray({
    control,
    name: "vendors",
  });

  // Global item options
  const itemOptions = useMemo(() => {
    return items.map((item) => {
      const catName =
        categories.find((c) => c.categoryId === item.categoryId)?.name || "";
      const subName =
        subcategories.find((s) => s.subCategoryId === item.subCategoryId)
          ?.name || "";
      const uomName = uoms.find((u) => u.uomId === item.uomId)?.name || "";
      return {
        value: item.itemId,
        label: `${catName} - ${subName} - ${item.description} - ${uomName}`,
      };
    });
  }, [items, categories, subcategories, uoms]);

  // Global state options for India
  const stateOptions = useMemo(() => {
    const states = getStatesOfCountry("IN");
    return states.map((s) => ({ value: s.name, label: s.name }));
  }, []);

  // Per-vendor city options (memoized by vendor index)
  const getCityOptions = useMemo(() => {
    return (vendorIndex) => {
      const vendorState = watch(`vendors.${vendorIndex}.vendor.state`);
      if (!vendorState) return [];

      const states = getStatesOfCountry("IN");
      const state = states.find((s) => s.name === vendorState);
      if (!state) return [];

      const cities = getCitiesOfState("IN", state.isoCode);
      return cities.map((c) => ({ value: c.name, label: c.name }));
    };
  }, [watch]);

  async function onSubmit(data) {
    try {
      let createdCount = 0;
      for (const vendorData of data.vendors) {
        await createVendor.mutateAsync(vendorData);
        createdCount++;
      }
      toast.success(`Created ${createdCount} vendors successfully`);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e.message || "Failed to create vendors");
    }
  }

  useEffect(() => {
    if (!open) {
      reset();
      setMode("manual");
    }
  }, [open, reset]);

  const handleItemSelect = (selectedItem, vendorIndex, mappingIndex) => {
    setValue(
      `vendors.${vendorIndex}.mappings.${mappingIndex}.itemId`,
      selectedItem ? selectedItem.value : ""
    );
  };

  const handleAddMapping = (vendorIndex) => {
    appendMapping(
      { name: "mappings", index: vendorIndex },
      {
        itemId: "",
        price: "",
        uom: "",
        leadTimeDays: "",
        notes: "",
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-11/12 sm:max-w-11/12 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-indigo-600">Add Vendors</DialogTitle>
            <DialogDescription>
              Add multiple vendors with details, contacts, and item mappings
              manually or upload vendors/contacts via bulk.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={mode} onValueChange={setMode} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="manual">Manual Add</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  {vendorFields.map((vendorField, vendorIndex) => {
                    return (
                      <Card key={vendorField.id} className="p-0">
                        <CardContent className="p-4">
                          <div
                            className={cx(
                              "flex justify-between items-center",
                              !hiddenVendorSections.includes(vendorIndex) &&
                                "mb-4"
                            )}
                          >
                            <h3 className="font-semibold">
                              Vendor {vendorIndex + 1}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                              {vendorFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeVendor(vendorIndex)}
                                >
                                  <Trash2 className="h-4 w-4 " />
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleHideSection(vendorIndex)}
                                className="bg-gray-600 hover:bg-gray-700 text-white hover:text-white"
                              >
                                <ChevronUp
                                  className={cx(
                                    " transition-all duration-300 ease-in ",
                                    !hiddenVendorSections.includes(
                                      vendorIndex
                                    ) && " rotate-180"
                                  )}
                                />
                              </Button>
                            </div>
                          </div>

                          {!hiddenVendorSections.includes(vendorIndex) && (
                            <>
                              {/* Vendor Details */}
                              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                                <div className="space-y-2">
                                  <Label>
                                    Name <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.name`
                                    )}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.name && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor.name
                                          .message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone</Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.phone`
                                    )}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.phone && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor.phone
                                          .message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.email`
                                    )}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.email && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor.email
                                          .message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>GST</Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.gst`
                                    )}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Address</Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.address`
                                    )}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.address && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor
                                          .address.message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>State</Label>
                                  <Select
                                    options={stateOptions}
                                    value={stateOptions.find(
                                      (opt) =>
                                        opt.value ===
                                        watch(
                                          `vendors.${vendorIndex}.vendor.state`
                                        )
                                    )}
                                    onChange={(opt) => {
                                      setValue(
                                        `vendors.${vendorIndex}.vendor.state`,
                                        opt ? opt.value : ""
                                      );
                                      setValue(
                                        `vendors.${vendorIndex}.vendor.city`,
                                        ""
                                      ); // Clear city
                                    }}
                                    placeholder="Select state..."
                                    isClearable
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                    isDisabled={createVendor.isPending}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.state && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor.state
                                          .message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>City</Label>
                                  <Select
                                    options={getCityOptions(vendorIndex)}
                                    value={getCityOptions(vendorIndex).find(
                                      (opt) =>
                                        opt.value ===
                                        watch(
                                          `vendors.${vendorIndex}.vendor.city`
                                        )
                                    )}
                                    onChange={(opt) =>
                                      setValue(
                                        `vendors.${vendorIndex}.vendor.city`,
                                        opt ? opt.value : ""
                                      )
                                    }
                                    placeholder={
                                      watch(
                                        `vendors.${vendorIndex}.vendor.state`
                                      )
                                        ? "Select city..."
                                        : "Select state first"
                                    }
                                    isClearable
                                    isDisabled={
                                      !watch(
                                        `vendors.${vendorIndex}.vendor.state`
                                      ) || createVendor.isPending
                                    }
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    styles={customSelectStyles}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.city && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor.city
                                          .message
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Pin Code</Label>
                                  <Input
                                    {...register(
                                      `vendors.${vendorIndex}.vendor.pinCode`
                                    )}
                                  />
                                  {errors.vendors?.[vendorIndex]?.vendor
                                    ?.pinCode && (
                                    <p className="text-sm text-red-500">
                                      {
                                        errors.vendors[vendorIndex].vendor
                                          .pinCode.message
                                      }
                                    </p>
                                  )}
                                </div>
                                {/* <div className="space-y-2 flex items-center">
                              <Label className="mr-2">Active</Label>
                              <Switch
                                checked={watch(
                                  `vendors.${vendorIndex}.vendor.active`
                                )}
                                onCheckedChange={(checked) =>
                                  setValue(
                                    `vendors.${vendorIndex}.vendor.active`,
                                    checked
                                  )
                                }
                              />
                            </div> */}
                              </div>

                              <VendorContactsSection
                                vendorIndex={vendorIndex}
                                control={control}
                                register={register}
                                errors={errors}
                              />

                              <VendorMappingsSection
                                vendorIndex={vendorIndex}
                                control={control}
                                register={register}
                                watch={watch}
                                errors={errors}
                                itemOptions={itemOptions}
                                customSelectStyles={customSelectStyles}
                                setValue={setValue}
                              />
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {errors.vendors && (
                    <p className="text-sm text-red-500">
                      {errors.vendors.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendVendor({
                        vendor: {
                          name: "",
                          address: "",
                          state: "",
                          city: "",
                          pinCode: "",
                          gst: "",
                          phone: "",
                          email: "",
                          active: true,
                        },
                        contacts: [],
                        mappings: [],
                      })
                    }
                    disabled={createVendor.isPending}
                    className="bg-gray-600 hover:bg-gray-700 text-white hover:text-white"
                  >
                    + Add
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={createVendor.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createVendor.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white"
                    >
                      {createVendor.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {createVendor.isPending ? "Creating..." : "Create "}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="bulk" className="mt-4">
              <VendorBulkUpload
                onVendorsLoaded={(vendorsFromExcel) => {
                  // Load bulk vendors into manual form
                  reset({ vendors: vendorsFromExcel });

                  // Switch to manual tab
                  setMode("manual");

                  toast.success(
                    `Loaded ${vendorsFromExcel.length} vendors. You can edit before saving.`
                  );
                }}
                onOpenChange={onOpenChange}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
