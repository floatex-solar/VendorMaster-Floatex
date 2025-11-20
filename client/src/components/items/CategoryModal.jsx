// src/components/items/CategoryModal.jsx
import React, { useState } from "react";
import { toast } from "sonner";
import {
  useCreateCategory,
  useCreateSubCategory,
  useCategories,
  useSubCategories,
} from "../../hooks/useCategories";

export function AddCategoryModal({ open, onClose }) {
  const [name, setName] = useState("");
  const create = useCreateCategory();

  async function onSubmit(e) {
    e.preventDefault();
    if (!name) return toast.info("Enter category name");
    await create.mutateAsync({ name });
    setName("");
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-gray-800 rounded p-4 w-96"
      >
        <h3 className="text-lg font-semibold mb-2">Add Category</h3>
        <input
          className="w-full px-3 py-2 border rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 rounded border"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-white"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddSubCategoryModal({ open, onClose, categoryId }) {
  const [name, setName] = useState("");
  const createSub = useCreateSubCategory();

  async function onSubmit(e) {
    e.preventDefault();
    if (!name || !categoryId)
      return toast.info("Select a category and enter a name");
    await createSub.mutateAsync({ categoryId, name });
    setName("");
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-gray-800 rounded p-4 w-96"
      >
        <h3 className="text-lg font-semibold mb-2">Add SubCategory</h3>
        <input
          className="w-full px-3 py-2 border rounded mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="SubCategory name"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 rounded border"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-white"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
