// src/components/vendors/VendorContactsSection.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { cx } from "class-variance-authority";

export default function VendorContactsSection({
  vendorIndex,
  control,
  register,
  errors,
}) {
  const {
    fields: contactFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `vendors.${vendorIndex}.contacts`,
  });

  return (
    <Card className="mb-6 p-0">
      <CardContent className="p-4">
        <div
          className={cx(
            "flex justify-between items-center",
            contactFields.length > 0 && "mb-4"
          )}
        >
          <h4 className="font-semibold">Contact Persons</h4>
          <Button
            type="button"
            size="sm"
            className="bg-gray-600 hover:bg-gray-700 text-white hover:text-white"
            onClick={() =>
              append({
                name: "",
                designation: "",
                phone: "",
                email: "",
                info: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {contactFields.length > 0 && (
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-[repeat(5,1fr)_40px] text-sm gap-4 sm:gap-2 bg-gray-200 py-2 rounded-md mb-2">
            <p className="pl-2">
              Name <span className="text-red-500">*</span>
            </p>
            <p className="pl-2">Designation</p>
            <p className="pl-2">Phone</p>
            <p className="pl-2">Email</p>
            <p className="pl-2">Info</p>
            <p className="pl-2 hidden sm:block text-right"></p>
          </div>
        )}

        {contactFields.map((contactField, contactIndex) => (
          <div
            key={contactField.id}
            className="border sm:border-none p-4 sm:p-0 rounded-md mb-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-[repeat(5,1fr)_40px] gap-4 sm:gap-2">
              <div className="space-y-2">
                <Label className="sm:hidden">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.contacts.${contactIndex}.name`
                  )}
                  placeholder="Enter Name"
                />
                {errors.vendors?.[vendorIndex]?.contacts?.[contactIndex]
                  ?.name && (
                  <p className="text-sm text-red-500">
                    {
                      errors.vendors[vendorIndex].contacts[contactIndex].name
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">Designation</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.contacts.${contactIndex}.designation`
                  )}
                  placeholder="Enter Designation"
                />
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">Phone</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.contacts.${contactIndex}.phone`
                  )}
                  placeholder="Enter Phone"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">Email</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.contacts.${contactIndex}.email`
                  )}
                  placeholder="Enter Email"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label className="sm:hidden">Info</Label>
                <Input
                  {...register(
                    `vendors.${vendorIndex}.contacts.${contactIndex}.info`
                  )}
                  placeholder="Enter Info"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(contactIndex)}
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
