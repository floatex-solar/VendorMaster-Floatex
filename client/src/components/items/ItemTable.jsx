// src/components/items/ItemTable.jsx (updated with shadcn Table and other components)
import React, { useState, useMemo } from "react";
import {
  useItems,
  useDeleteItem,
  useBulkDeleteItem,
} from "../../hooks/useItems";
import { useCategories, useSubCategories } from "../../hooks/useCategories";
import { useUoms } from "../../hooks/useUoms";
import Select from "react-select";
import ReactPaginate from "react-paginate";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";

const customSelectStyles = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  control: (provided) => ({
    ...provided,
    minHeight: "36px",
    height: "36px",
    borderColor: "oklch(0.922 0 0)",
    borderRadius: "0.375rem",
    boxShadow:
      "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 1px 2px 0 rgb(0 0 0 / 0.05)",
    fontSize: "0.875rem",
    color: "black",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "36px",
    padding: "0 6px",
    fontSize: "0.875rem",
    color: "black",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    fontSize: "0.875rem",
    color: "black",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "black",
    opacity: 1,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "black",
    opacity: 0.6,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    padding: "6px 10px",
    backgroundColor: state.isFocused ? "oklch(0.97 0 0)" : "transparent",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "36px",
  }),
};

export default function ItemTable({ onEdit }) {
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const pageSize = 30;
  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const { data: uoms = [] } = useUoms();
  const deleteMutation = useDeleteItem();
  const bulkDelete = useBulkDeleteItem();

  const catFilterOptions = useMemo(
    () => categories.map((c) => ({ value: c.categoryId, label: c.name })),
    [categories]
  );

  const subFilterOptions = useMemo(() => {
    const pool = selectedCategory
      ? subcategories.filter((s) => s.categoryId === selectedCategory)
      : subcategories;
    return pool.map((s) => ({ value: s.subCategoryId, label: s.name }));
  }, [subcategories, selectedCategory]);

  const getCatName = React.useCallback(
    (catId) =>
      categories.find((c) => c.categoryId === catId)?.name || catId || "-",
    [categories]
  );
  const getSubName = React.useCallback(
    (subId) =>
      subcategories.find((s) => s.subCategoryId === subId)?.name ||
      subId ||
      "-",
    [subcategories]
  );
  const getUomName = React.useCallback(
    (uomId) => uoms.find((u) => u.uomId === uomId)?.name || uomId || "-",
    [uoms]
  );

  const filtered = useMemo(() => {
    let f = items;
    const low = q.toLowerCase();
    if (q) {
      f = f.filter(
        (i) =>
          (i.description || "").toLowerCase().includes(low) ||
          getUomName(i.uomId).toLowerCase().includes(low) ||
          getCatName(i.categoryId).toLowerCase().includes(low) ||
          getSubName(i.subCategoryId).toLowerCase().includes(low)
      );
    }
    if (selectedCategory) {
      f = f.filter((i) => i.categoryId === selectedCategory);
    }
    if (selectedSubCategory) {
      f = f.filter((i) => i.subCategoryId === selectedSubCategory);
    }
    return f;
  }, [
    items,
    q,
    selectedCategory,
    selectedSubCategory,
    getCatName,
    getSubName,
    getUomName,
  ]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const safePage =
    pageCount === 0 ? 0 : Math.min(currentPage, Math.max(pageCount - 1, 0));

  const paginated = useMemo(() => {
    const start = safePage * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, safePage, pageSize]);

  const toggleSelection = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = (checked) => {
    if (checked) {
      setSelected(new Set(filtered.map((i) => i.itemId)));
    } else {
      setSelected(new Set());
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleIndividualDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmIndividualDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.itemId);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmBulkDelete = () => {
    bulkDelete.mutate(Array.from(selected));
    setSelected(new Set());
    setBulkDeleteDialogOpen(false);
  };

  const categoryValue = selectedCategory
    ? catFilterOptions.find((opt) => opt.value === selectedCategory)
    : null;
  const subCategoryValue = selectedSubCategory
    ? subFilterOptions.find((opt) => opt.value === selectedSubCategory)
    : null;

  const handleCategoryFilterChange = (opt) => {
    const value = opt ? opt.value : "";
    setSelectedCategory(value);
    if (!value) {
      setCurrentPage(0);
      return;
    }
    const chosenSub = subcategories.find(
      (s) => s.subCategoryId === selectedSubCategory
    );
    if (selectedSubCategory && chosenSub?.categoryId !== value) {
      setSelectedSubCategory("");
    }
    setCurrentPage(0);
  };

  const handleSubCategoryFilterChange = (opt) => {
    setSelectedSubCategory(opt ? opt.value : "");
    setCurrentPage(0);
  };

  const showingFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const showingTo =
    filtered.length === 0
      ? 0
      : Math.min((safePage + 1) * pageSize, filtered.length);

  const isAllSelected =
    selected.size === filtered.length && filtered.length > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2 flex-1">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search description, category, subcategory, UOM..."
            className="flex-1"
          />
          <Select
            options={catFilterOptions}
            value={categoryValue}
            onChange={handleCategoryFilterChange}
            placeholder="Filter Category"
            isClearable
            className="flex-1 text-xs md:text-sm"
            classNamePrefix="react-select"
            styles={customSelectStyles}
          />
          <Select
            options={subFilterOptions}
            value={subCategoryValue}
            onChange={handleSubCategoryFilterChange}
            placeholder="Filter Subcategory"
            isClearable
            className="flex-1 text-xs md:text-sm"
            classNamePrefix="react-select"
            styles={customSelectStyles}
          />
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <>
              <Button onClick={handleBulkDelete} variant="destructive">
                Delete Selected ({selected.size})
              </Button>
              <Button onClick={() => setSelected(new Set())} variant="outline">
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border max-h-160 overflow-auto mb-4 w-[87vw] sm:w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={selectAll}
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead>Item ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub-Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginated.map((it) => (
                  <TableRow key={it.itemId} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(it.itemId)}
                        onCheckedChange={() => toggleSelection(it.itemId)}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell>{it.itemId}</TableCell>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>{getCatName(it.categoryId)}</TableCell>
                    <TableCell>{getSubName(it.subCategoryId)}</TableCell>
                    <TableCell>{getUomName(it.uomId)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(it)}
                        className="mr-2"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleIndividualDelete(it)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No items found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm order-1 sm:order-0 text-muted-foreground">
          Showing {showingFrom} to {showingTo} of {filtered.length} items
        </div>
        {pageCount > 1 && (
          <ReactPaginate
            previousLabel={"<"}
            nextLabel={">"}
            breakLabel={"..."}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            containerClassName={"flex justify-center gap-1 mb-4"}
            pageClassName={"px-3 py-1 cursor-pointer border rounded"}
            activeClassName={"bg-primary text-white"}
            previousClassName={"px-3 py-1 cursor-pointer border rounded"}
            nextClassName={"px-3 py-1 cursor-pointer border rounded"}
            breakClassName={"px-3 py-1"}
            forcePage={safePage}
          />
        )}
      </div>

      {/* Individual Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete item {itemToDelete?.itemId} — {itemToDelete?.description}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmIndividualDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selected.size} selected items? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
