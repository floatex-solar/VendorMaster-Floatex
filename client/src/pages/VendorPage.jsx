// src/pages/VendorPage.jsx
import VendorTable from "../components/vendors/VendorTable";
import VendorForm from "../components/vendors/VendorForm";
// import EditVendorForm from "../components/vendors/EditVendorForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EditVendorForm from "../components/vendors/EditVendorForm";

export default function VendorPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-indigo-600">Vendor Master</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white"
          >
            Add Vendor
          </Button>
        </div>
      </div>

      <VendorTable
        onEdit={(vendor) => {
          setSelectedVendor(vendor);
          setEditOpen(true);
        }}
      />

      <VendorForm open={open} onOpenChange={setOpen} />
      <EditVendorForm
        open={editOpen}
        setOpen={setEditOpen}
        vendorData={selectedVendor}
      />
    </div>
  );
}
