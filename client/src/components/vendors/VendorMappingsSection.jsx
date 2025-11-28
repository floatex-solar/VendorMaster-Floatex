// src/components/vendors/VendorMappingsSection.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { cx } from "class-variance-authority";
import { useUoms } from "../../hooks/useUoms";

export default function VendorMappingsSection({
  vendorIndex,
  control,
  register,
  watch,
  errors,
  itemOptions,
  customSelectStyles,
  setValue,
}) {
  const {
    fields: mappingFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `vendors.${vendorIndex}.mappings`,
  });

  const { data: uoms = [] } = useUoms();

  return (
    <Card className="p-0">
      <CardContent className="p-4">
        <div
          className={cx(
            "flex justify-between items-center",
            mappingFields.length > 0 && "mb-4"
          )}
        >
          <h4 className="font-semibold">Item Mappings</h4>

          <Button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white hover:text-white"
            size="sm"
            onClick={() =>
              append({
                itemId: "",
                price: "",
                uom: "",
                leadTimeDays: "",
                notes: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {mappingFields.length > 0 && (
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[repeat(8,1fr)_40px] text-sm gap-4 sm:gap-2 bg-gray-200 py-2 rounded-md mb-2">
            <p className="pl-2 col-span-3">
              Item <span className="text-red-500">*</span>
            </p>
            <p className="pl-2">Price</p>
            <p className="pl-2">Uom (Per/-)</p>
            <p className="pl-2">Lead Time (Days)</p>
            <p className="pl-2">Notes</p>
            <p className="pl-2 hidden sm:block text-right"></p>
          </div>
        )}

        {mappingFields.map((mappingField, mappingIndex) => (
          <div
            key={mappingField.id}
            className="border p-4 sm:p-0 sm:border-none rounded-md mb-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(8,1fr)_40px] gap-4 sm:gap-2">
              <div className="space-y-2  sm:col-span-3">
                <Label className="sm:hidden">
                  Item <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={itemOptions}
                  value={itemOptions.find(
                    (opt) =>
                      opt.value ===
                      watch(
                        `vendors.${vendorIndex}.mappings.${mappingIndex}.itemId`
                      )
                  )}
                  onChange={(opt) =>
                    setValue(
                      `vendors.${vendorIndex}.mappings.${mappingIndex}.itemId`,
                      opt ? opt.value : ""
                    )
                  }
                  placeholder="Select item"
                  isClearable
                  styles={customSelectStyles}
                />
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">Price</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.mappings.${mappingIndex}.price`
                  )}
                  placeholder="Enter Price"
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">UOM (Per/-)</Label>
                <Select
                  options={uoms.map((uom) => ({
                    value: uom.name,
                    label: uom.name,
                  }))}
                  value={uoms
                    .map((uom) => ({
                      value: uom.name,
                      label: uom.name,
                    }))
                    .find(
                      (opt) =>
                        opt.value ===
                        watch(
                          `vendors.${vendorIndex}.mappings.${mappingIndex}.uom`
                        )
                    )}
                  onChange={(opt) =>
                    setValue(
                      `vendors.${vendorIndex}.mappings.${mappingIndex}.uom`,
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
                  {...register(
                    `vendors.${vendorIndex}.mappings.${mappingIndex}.leadTimeDays`
                  )}
                  placeholder="Enter Lead Time (Days)"
                  type="number"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="sm:hidden">Notes</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.mappings.${mappingIndex}.notes`
                  )}
                  placeholder="Enter Notes"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(mappingIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
