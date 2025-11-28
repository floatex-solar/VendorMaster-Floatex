// src/pages/ItemsPage.jsx (updated to remove Bulk Upload UI)
import ItemTable from "../components/items/ItemTable";
import ItemForm from "../components/items/ItemForm";
import EditItemForm from "../components/items/EditItemForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ItemsPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-indigo-600">Item Master</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white"
          >
            Add Item
          </Button>
        </div>
      </div>
      <ItemTable
        onEdit={(item) => {
          setSelectedItem(item);
          setEditOpen(true);
        }}
      />
      <ItemForm open={open} onOpenChange={setOpen} />
      <EditItemForm open={editOpen} setOpen={setEditOpen} item={selectedItem} />
    </div>
  );
}
