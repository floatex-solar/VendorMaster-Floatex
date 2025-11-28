// src/components/vendors/VendorMappingRow.jsx
import React, { useMemo } from "react";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { customSelectStyles } from "../../utils/customSelectStyles";

export default function VendorMappingRow({
  index,
  control,
  register,
  watch,
  updateRow,
  markDeleted,
  undoDelete,
  vendorOptions,
  uomOptions,
  errors,
}) {
  const row = watch(`mappings.${index}`);
  const disabled = row.deleted;

  const vendorValue = useMemo(
    () => vendorOptions.find((v) => v.value === row.vendorId) || null,
    [row.vendorId, vendorOptions]
  );

  const uomValue = useMemo(
    () => uomOptions.find((u) => u.value === row.uom) || null,
    [row.uom, uomOptions]
  );

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[repeat(8,1fr)_40px] gap-4 mb-4 sm:mb-2 sm:items-start sm:gap-2 p-3 sm:p-0 border sm:border-none rounded relative ${
        disabled ? "bg-red-50 opacity-70" : ""
      }`}
    >
      {/* {disabled && (
        <span className="absolute -top-2 left-2 bg-red-500 text-white text-xs px-2 rounded">
          Deleted
        </span>
      )} */}

      {/* Vendor */}
      <div className="space-y-1 sm:col-span-3">
        <Label className="sm:hidden">Vendor</Label>
        <Controller
          control={control}
          name={`mappings.${index}.vendorId`}
          render={({ field }) => (
            <Select
              options={vendorOptions}
              isDisabled={disabled}
              value={vendorValue}
              onChange={(opt) =>
                updateRow(index, "vendorId", opt ? opt.value : "")
              }
              placeholder="Select Vendor"
              isClearable
              styles={customSelectStyles("36px")}
            />
          )}
        />
        {errors?.mappings?.[index]?.vendorId && (
          <p className="text-red-500 text-sm">
            {errors.mappings[index].vendorId.message}
          </p>
        )}
      </div>

      {/* Rate */}
      <div className="space-y-1">
        <Label className="sm:hidden">Rate</Label>
        <Input
          {...register(`mappings.${index}.price`)}
          disabled={disabled}
          placeholder="Enetr Rate"
        />
      </div>

      {/* UOM */}
      <div className="space-y-1">
        <Label className="sm:hidden">UOM</Label>
        <Controller
          control={control}
          name={`mappings.${index}.uom`}
          render={({ field }) => (
            <Select
              options={uomOptions}
              isDisabled={disabled}
              value={uomValue}
              onChange={(opt) => updateRow(index, "uom", opt ? opt.value : "")}
              isClearable
              placeholder="Select Uom"
              styles={customSelectStyles("36px")}
            />
          )}
        />
      </div>

      {/* Lead Days */}
      <div className="space-y-1">
        <Label className="sm:hidden">Lead Time</Label>
        <Input
          {...register(`mappings.${index}.leadTimeDays`)}
          disabled={disabled}
          placeholder="Enter Lead Time"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1 sm:col-span-2">
        <Label className="sm:hidden">Notes</Label>
        <Input
          {...register(`mappings.${index}.notes`)}
          disabled={disabled}
          placeholder="Enter Notes"
        />
      </div>

      {/* Delete / Undo */}
      <div className="flex items-end w-full">
        {!disabled ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => markDeleted(index)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => undoDelete(index)}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
