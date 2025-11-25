// src/components/vendors/EditVendorForm.jsx
import React, { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateVendor, useVendor } from "../../hooks/useVendors";
import { useItems } from "../../hooks/useItems";
import { useCategories, useSubCategories } from "../../hooks/useCategories";
import { useUoms } from "../../hooks/useUoms";
import { State, City } from "country-state-city";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Loader2, Plus, RotateCcw } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";

const { getStatesOfCountry } = State;
const { getCitiesOfState } = City;

const schema = z.object({
  vendor: z.object({
    name: z.string().min(1, "Name required"),
    address: z.string().min(1, "Address required"),
    state: z.string().min(1, "State required"),
    city: z.string().min(1, "City required"),
    pinCode: z.string().min(1, "Pin Code required"),
    gst: z.string().optional(),
    phone: z.string().min(1, "Phone required"),
    email: z.string().optional(),
    active: z.boolean(),
  }),
  contacts: z
    .array(
      z.object({
        contactId: z.string().optional(),
        name: z.string().min(1, "Contact name required"),
        designation: z.string().optional(),
        phone: z.string().min(1, "Phone required"),
        email: z.string().optional(),
        info: z.string().optional(),
        _action: z.enum(["add", "update", "delete"]).optional(),
      })
    )
    .optional(),
  mappings: z
    .array(
      z.object({
        mappingId: z.string().optional(),
        itemId: z.string().min(1, "Item required"),
        price: z.string().optional(),
        uom: z.string().optional(),
        leadTimeDays: z.string().optional(),
        notes: z.string().optional(),
        _action: z.enum(["add", "update", "delete"]).optional(),
      })
    )
    .optional(),
});

const customSelectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (provided) => ({
    ...provided,
    minHeight: "34px",
    height: "34px",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "34px",
    padding: "0 6px",
    fontSize: "0.875rem",
  }),
  input: (provided) => ({ ...provided, margin: 0, fontSize: "0.875rem" }),
  singleValue: (provided) => ({ ...provided, fontSize: "0.875rem" }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    padding: "6px 10px",
    backgroundColor: state.isFocused ? "rgba(0,0,0,0.04)" : "transparent",
  }),
  indicatorsContainer: (provided) => ({ ...provided, height: "34px" }),
};

export default function EditVendorForm({ vendorData = null, open, setOpen }) {
  const qc = useQueryClient();
  const updateVendor = useUpdateVendor();

  const vendorId = vendorData?.vendorId;
  const { data: fullVendor } = useVendor(vendorId); // hook has internal enabled guard

  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();

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
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
    update: updateContact,
  } = useFieldArray({ control, name: "contacts" });
  const {
    fields: mappingFields,
    append: appendMapping,
    remove: removeMapping,
    update: updateMapping,
  } = useFieldArray({ control, name: "mappings" });

  // === India State & City ===
  const stateOptions = useMemo(() => {
    const states = getStatesOfCountry("IN") || [];
    return states.map((s) => ({
      value: s.name,
      label: s.name,
      isoCode: s.isoCode,
    }));
  }, []);

  const watchedState = watch("vendor.state");
  const cityOptions = useMemo(() => {
    if (!watchedState) return [];
    const stateObj =
      stateOptions.find((s) => s.value === watchedState) ||
      stateOptions.find((s) => s.label === watchedState);
    if (!stateObj) return [];
    const cities = getCitiesOfState("IN", stateObj.isoCode) || [];
    return cities.map((c) => ({ value: c.name, label: c.name }));
  }, [watchedState, stateOptions]);

  // === Item Search Options ===
  const itemOptions = useMemo(() => {
    return items.map((item) => {
      const cat =
        categories.find((c) => c.categoryId === item.categoryId)?.name || "";
      const sub =
        subcategories.find((s) => s.subCategoryId === item.subCategoryId)
          ?.name || "";
      const uom = uoms.find((u) => u.uomId === item.uomId)?.name || "";
      return {
        value: item.itemId,
        label: `${cat}${sub ? ` • ${sub}` : ""}${
          item.description ? ` • ${item.description}` : ""
        }${uom ? ` • ${uom}` : ""}`,
        item,
      };
    });
  }, [items, categories, subcategories, uoms]);

  // Populate form when dialog opens & fullVendor available
  useEffect(() => {
    if (!open || !fullVendor) return;

    const v = fullVendor.vendor || {};

    const baseVendor = {
      name: v.name || "",
      address: v.address || "",
      state: v.state || "",
      city: v.city || "",
      pinCode: v.pinCode || "",
      gst: v.gst || "",
      phone: v.phone || "",
      email: v.email || "",
      active: v.active ?? true,
    };

    const contacts = (fullVendor.contacts || []).map((c) => ({
      contactId: c.contactId,
      name: c.name || "",
      designation: c.designation || "",
      phone: c.phone || "",
      email: c.email || "",
      info: c.info || "",
      _action: "update",
    }));

    const mappings = (fullVendor.mappings || []).map((m) => ({
      mappingId: m.mappingId,
      itemId: m.itemId || "",
      price: m.price ?? "",
      uom: m.uom,
      leadTimeDays: m.leadTimeDays ?? "",
      notes: m.notes ?? "",
      _action: "update",
    }));

    reset({ vendor: baseVendor, contacts, mappings });
  }, [open, fullVendor, reset]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      // clear after dialog close to avoid stale data
      const t = setTimeout(() => reset(), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, reset]);

  const onSubmit = async (data) => {
    if (!fullVendor?.vendor?.vendorId) {
      toast.error("No vendor selected");
      return;
    }
    try {
      // Ensure mappings include uom field (send empty string or populate from item master if available)
      const enriched = { ...data };
      // enriched.mappings = (enriched.mappings || []).map((m) => {
      //   const item = items.find((it) => it.itemId === m.itemId);
      //   return {
      //     ...m,
      //     uom: item ? item.uomId || "" : "",
      //   };
      // });

      await updateVendor.mutateAsync({
        id: fullVendor.vendor.vendorId,
        payload: enriched,
      });
      toast.success("Vendor updated successfully");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({
        queryKey: ["vendor", fullVendor.vendor.vendorId],
      });
    } catch (e) {
      toast.error(e.message || "Failed to update vendor");
    }
  };

  const addContact = () =>
    appendContact({
      name: "",
      designation: "",
      phone: "",
      email: "",
      info: "",
      _action: "add",
    });
  const toggleContactDelete = (index) => {
    const contact = watch(`contacts.${index}`);
    if (!contact) return;
    if (contact._action === "delete") {
      updateContact(index, {
        ...contact,
        _action: contact.contactId ? "update" : undefined,
      });
    } else {
      updateContact(index, { ...contact, _action: "delete" });
    }
  };

  const addMapping = () =>
    appendMapping({
      itemId: "",
      price: "",
      uom: "",
      leadTimeDays: "",
      notes: "",
      _action: "add",
    });
  const toggleMappingDelete = (index) => {
    const mapping = watch(`mappings.${index}`);
    if (!mapping) return;
    if (mapping._action === "delete") {
      updateMapping(index, {
        ...mapping,
        _action: mapping.mappingId ? "update" : undefined,
      });
    } else {
      updateMapping(index, { ...mapping, _action: "delete" });
    }
  };

  const handleItemChange = (option, index) => {
    const itemId = option ? option.value : "";
    setValue(`mappings.${index}.itemId`, itemId);
    // set uom hidden field from item master if available
    const item = items.find((it) => it.itemId === itemId);
    setValue(`mappings.${index}.uom`, item ? item.uomId || "" : "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-11/12 sm:max-w-11/12 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
        </DialogHeader>

        {!fullVendor && vendorId ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vendor Details */}
            <Card className="p-0">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Vendor Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      {...register("vendor.name")}
                      disabled={updateVendor.isPending}
                    />
                    {errors.vendor?.name && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone </Label>
                    <Input
                      {...register("vendor.phone")}
                      disabled={updateVendor.isPending}
                    />
                    {errors.vendor?.phone && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      {...register("vendor.email")}
                      disabled={updateVendor.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST</Label>
                    <Input
                      {...register("vendor.gst")}
                      disabled={updateVendor.isPending}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Address </Label>
                    <Input
                      {...register("vendor.address")}
                      disabled={updateVendor.isPending}
                    />
                    {errors.vendor?.address && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State </Label>
                    <Select
                      options={stateOptions}
                      value={stateOptions.find(
                        (o) => o.value === watch("vendor.state")
                      )}
                      onChange={(opt) => {
                        setValue("vendor.state", opt ? opt.value : "");
                        setValue("vendor.city", "");
                      }}
                      placeholder="Select state..."
                      isClearable
                      styles={customSelectStyles}
                      isDisabled={updateVendor.isPending}
                    />
                    {errors.vendor?.state && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>City </Label>
                    <Select
                      options={cityOptions}
                      value={cityOptions.find(
                        (o) => o.value === watch("vendor.city")
                      )}
                      onChange={(opt) =>
                        setValue("vendor.city", opt ? opt.value : "")
                      }
                      placeholder={
                        watchedState ? "Select city..." : "Select state first"
                      }
                      isClearable
                      isDisabled={!watchedState || updateVendor.isPending}
                      styles={customSelectStyles}
                    />
                    {errors.vendor?.city && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pin Code </Label>
                    <Input
                      {...register("vendor.pinCode")}
                      disabled={updateVendor.isPending}
                    />
                    {errors.vendor?.pinCode && (
                      <p className="text-sm text-red-500">
                        {errors.vendor.pinCode.message}
                      </p>
                    )}
                  </div>

                  {/* <div className="flex items-center space-x-3">
                  <Label>Active</Label>
                  <Switch
                    checked={watch("vendor.active")}
                    onCheckedChange={(v) => setValue("vendor.active", v)}
                    disabled={updateVendor.isPending}
                  />
                </div> */}
                </div>
              </CardContent>
            </Card>

            {/* Contact Persons */}
            <Card className="gap-0">
              <CardHeader className="gap-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contact Persons</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContact}
                    disabled={updateVendor.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {contactFields.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No contacts added
                  </div>
                )}

                {contactFields.length > 0 && (
                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[repeat(5,1fr)_40px] text-sm gap-4 sm:gap-2 bg-gray-200 py-2 rounded-md mb-2">
                    <p className="pl-2">Name</p>
                    <p className="pl-2">Designation</p>
                    <p className="pl-2">Phone</p>
                    <p className="pl-2">Email</p>
                    <p className="pl-2">Info</p>
                    <p className="pl-2 hidden sm:block text-right"></p>
                  </div>
                )}

                {contactFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className={`border rounded-lg p-4 sm:p-0 sm:border-none mb-4 sm:mb-2 ${
                      watch(`contacts.${idx}._action`) === "delete"
                        ? "opacity-50 bg-red-100"
                        : ""
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[repeat(5,1fr)_40px] gap-4 sm:gap-2">
                      <div>
                        <Label className="sm:hidden">Name *</Label>
                        <Input
                          {...register(`contacts.${idx}.name`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`contacts.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Name"
                        />
                      </div>
                      <div>
                        <Label className="sm:hidden">Designation</Label>
                        <Input
                          {...register(`contacts.${idx}.designation`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`contacts.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Designaiton"
                        />
                      </div>
                      <div>
                        <Label className="sm:hidden">Phone </Label>
                        <Input
                          {...register(`contacts.${idx}.phone`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`contacts.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Phone"
                        />
                      </div>

                      <div>
                        <Label className="sm:hidden">Email</Label>
                        <Input
                          {...register(`contacts.${idx}.email`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`contacts.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Email"
                        />
                      </div>
                      <div className="">
                        <Label className="sm:hidden">Additional Info</Label>
                        <Input
                          {...register(`contacts.${idx}.info`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`contacts.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Info"
                        />
                      </div>

                      <div className="flex gap-2">
                        {watch(`contacts.${idx}.contactId`) ? (
                          <Button
                            type="button"
                            variant={
                              watch(`contacts.${idx}._action`) === "delete"
                                ? "default"
                                : "destructive"
                            }
                            size="sm"
                            onClick={() => toggleContactDelete(idx)}
                            disabled={updateVendor.isPending}
                            className="w-full sm:w-fit"
                          >
                            {watch(`contacts.${idx}._action`) === "delete" ? (
                              <>
                                <RotateCcw className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeContact(idx)}
                            disabled={updateVendor.isPending}
                            className="w-full sm:w-fit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Item Mappings */}
            <Card className="gap-0">
              <CardHeader className="gap-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Items Supplied by Vendor
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMapping}
                    disabled={updateVendor.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {mappingFields.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No items mapped
                  </div>
                )}

                {mappingFields.length > 0 && (
                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[repeat(8,1fr)_40px] text-sm gap-4 sm:gap-2 bg-gray-200 py-2 rounded-md mb-2">
                    <p className="pl-2 col-span-3">Item</p>
                    <p className="pl-2">Price</p>
                    <p className="pl-2">Uom (Per/-)</p>
                    <p className="pl-2">Lead Time (Days)</p>
                    <p className="pl-2">Notes</p>
                    <p className="pl-2 hidden sm:block text-right"></p>
                  </div>
                )}

                {mappingFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className={`border rounded-lg p-4 mb-4 sm:mb-2 sm:p-0 sm:border-none ${
                      watch(`mappings.${idx}._action`) === "delete"
                        ? "opacity-50 bg-red-100"
                        : ""
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[repeat(8,1fr)_40px] gap-4 sm:gap-2">
                      <div className="space-y-2 sm:col-span-3">
                        <Label className="sm:hidden">Item *</Label>
                        <Select
                          options={itemOptions}
                          value={itemOptions.find(
                            (o) => o.value === watch(`mappings.${idx}.itemId`)
                          )}
                          onChange={(opt) => handleItemChange(opt, idx)}
                          placeholder="Search: Category • Sub • Description • UOM"
                          isClearable
                          isDisabled={
                            updateVendor.isPending ||
                            watch(`mappings.${idx}._action`) === "delete"
                          }
                          styles={customSelectStyles}
                        />
                      </div>

                      <div>
                        <Label className="sm:hidden">Price</Label>
                        <Input
                          {...register(`mappings.${idx}.price`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`mappings.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Price"
                        />
                      </div>

                      {/* UOM is hidden in UI but maintained in form and sent to backend (populated from item master if available) */}
                      {/* <input
                        type="hidden"
                        {...register(`mappings.${idx}.uom`)}
                      /> */}

                      <div className="space-y-2">
                        <Label className="sm:hidden">UOM (Per/-)</Label>
                        <Select
                          options={uoms.map((uom) => ({
                            value: uom.name,
                            label: uom.name, // ensure label is displayed
                          }))}
                          value={uoms
                            .map((uom) => ({
                              value: uom.name,
                              label: uom.name,
                            }))
                            .find(
                              (opt) =>
                                opt.value === watch(`mappings.${idx}.uom`)
                            )}
                          onChange={(opt) =>
                            setValue(
                              `mappings.${idx}.uom`,
                              opt ? opt.value : ""
                            )
                          }
                          placeholder="Select UOM"
                          isClearable
                          styles={customSelectStyles}
                        />
                      </div>

                      <div>
                        <Label className="sm:hidden">Lead Time (Days)</Label>
                        <Input
                          {...register(`mappings.${idx}.leadTimeDays`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`mappings.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Lead Time"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="sm:hidden">Notes</Label>
                        <Input
                          {...register(`mappings.${idx}.notes`)}
                          disabled={
                            updateVendor.isPending ||
                            watch(`mappings.${idx}._action`) === "delete"
                          }
                          placeholder="Enter Notes"
                        />
                      </div>

                      <div className="flex gap-2">
                        {watch(`mappings.${idx}.mappingId`) ? (
                          <Button
                            type="button"
                            variant={
                              watch(`mappings.${idx}._action`) === "delete"
                                ? "default"
                                : "destructive"
                            }
                            size="sm"
                            onClick={() => toggleMappingDelete(idx)}
                            disabled={updateVendor.isPending}
                            className="w-full sm:w-fit"
                          >
                            {watch(`mappings.${idx}._action`) === "delete" ? (
                              <>
                                <RotateCcw className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMapping(idx)}
                            disabled={updateVendor.isPending}
                            className="w-full sm:w-fit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateVendor.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateVendor.isPending}>
                {updateVendor.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {updateVendor.isPending ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
