import React, { useState, useMemo } from "react";
import {
  useVendors,
  useVendor,
  useDeleteVendor,
  useBulkDeleteVendor,
} from "../../hooks/useVendors";
import Select from "react-select";
import ReactPaginate from "react-paginate";
import { Button } from "@/components/ui/button";
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
import { Pencil, Trash2, ChevronsDown, ChevronsUp } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useItems } from "../../hooks/useItems";
import { useCategories, useSubCategories } from "../../hooks/useCategories";
import { cx } from "class-variance-authority";
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

const customSelectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (provided) => ({
    ...provided,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.375rem",
    boxShadow:
      "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 1px 2px 0 rgb(0 0 0 / 0.05)",
    fontSize: "0.875rem",
    color: "black",
  }),
};

export default function VendorTable({ onEdit }) {
  const [q, setQ] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // currently expanded vendorId

  const pageSize = 30;
  const { data: vendors = [], isLoading } = useVendors();
  const deleteMutation = useDeleteVendor();
  const bulkDelete = useBulkDeleteVendor();

  // Options
  const stateOptions = useMemo(() => {
    const states = [...new Set(vendors.map((v) => v.state).filter(Boolean))];
    return states.map((s) => ({ value: s, label: s }));
  }, [vendors]);

  const cityOptions = useMemo(() => {
    const cities = selectedState
      ? vendors
          .filter((v) => v.state === selectedState)
          .map((v) => v.city)
          .filter(Boolean)
      : vendors.map((v) => v.city).filter(Boolean);
    const uniqueCities = [...new Set(cities)];
    return uniqueCities.map((c) => ({ value: c, label: c }));
  }, [vendors, selectedState]);

  // Filtering
  const filtered = useMemo(() => {
    let f = vendors;
    const low = q.toLowerCase();
    if (q) {
      f = f.filter(
        (v) =>
          (v.vendorId || "").toLowerCase().includes(low) ||
          (v.name || "").toLowerCase().includes(low) ||
          (v.phone || "").includes(low) ||
          (v.email || "").toLowerCase().includes(low) ||
          (v.city || "").toLowerCase().includes(low) ||
          (v.state || "").toLowerCase().includes(low)
      );
    }
    if (selectedState) f = f.filter((v) => v.state === selectedState);
    if (selectedCity) f = f.filter((v) => v.city === selectedCity);
    return f;
  }, [vendors, q, selectedState, selectedCity]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const safePage =
    pageCount === 0 ? 0 : Math.min(currentPage, Math.max(pageCount - 1, 0));
  const paginated = useMemo(
    () => filtered.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filtered, safePage, pageSize]
  );

  // Selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };
  const selectAll = (checked) => {
    if (checked) setSelected(new Set(filtered.map((v) => v.vendorId)));
    else setSelected(new Set());
  };

  const handleBulkDelete = () => setBulkDeleteDialogOpen(true);
  const handleIndividualDelete = (vendor) => {
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  };
  const confirmIndividualDelete = () => {
    if (vendorToDelete) deleteMutation.mutate(vendorToDelete.vendorId);
    setDeleteDialogOpen(false);
    setVendorToDelete(null);
  };
  const confirmBulkDelete = () => {
    bulkDelete.mutate(Array.from(selected));
    setSelected(new Set());
    setBulkDeleteDialogOpen(false);
  };

  const stateValue = selectedState
    ? stateOptions.find((opt) => opt.value === selectedState)
    : null;
  const cityValue = selectedCity
    ? cityOptions.find((opt) => opt.value === selectedCity)
    : null;
  const handleStateChange = (opt) => {
    const value = opt ? opt.value : "";
    setSelectedState(value);
    if (value) setSelectedCity("");
    setCurrentPage(0);
  };
  const handleCityChange = (opt) => {
    setSelectedCity(opt ? opt.value : "");
    setCurrentPage(0);
  };

  const showingFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const showingTo =
    filtered.length === 0
      ? 0
      : Math.min((safePage + 1) * pageSize, filtered.length);
  const isAllSelected =
    selected.size === filtered.length && filtered.length > 0;

  // Expand toggle: when expanding, we will fetch details using useVendor
  const toggleExpand = (vendorId) => {
    setExpandedId((prev) => (prev === vendorId ? null : vendorId));
  };

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
            placeholder="Search id, name, phone, email, city, state..."
            className="flex-1"
          />
          <Select
            options={stateOptions}
            value={stateValue}
            onChange={handleStateChange}
            placeholder="Filter State"
            isClearable
            className="flex-1 text-xs md:text-sm"
            classNamePrefix="react-select"
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
          <Select
            options={cityOptions}
            value={cityValue}
            onChange={handleCityChange}
            placeholder="Filter City"
            isClearable
            className="flex-1 text-xs md:text-sm"
            classNamePrefix="react-select"
            styles={customSelectStyles}
            menuPortalTarget={document.body}
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
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={selectAll}
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead>Vendor Id</TableHead>
              <TableHead>Name</TableHead>
              {/* <TableHead>Address</TableHead> */}
              <TableHead>State</TableHead>
              <TableHead>City</TableHead>
              {/* <TableHead>PinCode</TableHead> */}
              <TableHead>GST</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              {/* <TableHead className="text-right">Active</TableHead> */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((v) => (
                <React.Fragment key={v.vendorId}>
                  <TableRow
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleExpand(v.vendorId)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(v.vendorId)}
                        onCheckedChange={(e) => {
                          // Prevent row click from firing when clicking checkbox
                          e.stopPropagation?.();
                          toggleSelection(v.vendorId);
                        }}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell>{v.vendorId}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    {/* <TableCell className="max-w-[250px] truncate">
                      {v.address}
                    </TableCell> */}
                    <TableCell>{v.state}</TableCell>
                    <TableCell>{v.city}</TableCell>
                    {/* <TableCell>{v.pinCode}</TableCell> */}
                    <TableCell>{v.gst}</TableCell>
                    <TableCell>{v.phone}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    {/* <TableCell className="text-right">
                      {v.active ? "Yes" : "No"}
                    </TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(v);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualDelete(v);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(v.vendorId);
                          }}
                          className={cx(
                            "",
                            expandedId === v.vendorId &&
                              "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white"
                          )}
                        >
                          {expandedId === v.vendorId ? (
                            <ChevronsUp className="h-4 w-4" />
                          ) : (
                            <ChevronsDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded panel */}
                  {expandedId === v.vendorId && (
                    <TableRow>
                      <TableCell colSpan={12} className="p-0 border-0">
                        <Card className="m-2 p-4 gap-0">
                          <CardHeader className="p-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">
                                Details for {v.vendorId} — {v.name}
                              </h3>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <ExpandedVendorDetails vendorId={v.vendorId} />
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}

            {paginated.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No vendors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm order-1 sm:order-0 text-muted-foreground">
          Showing {showingFrom} to {showingTo} of {filtered.length} vendors
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
            containerClassName="flex justify-center gap-1 mb-4"
            pageClassName="px-3 py-1 cursor-pointer border rounded"
            activeClassName="bg-primary text-white"
            previousClassName="px-3 py-1 cursor-pointer border rounded"
            nextClassName="px-3 py-1 cursor-pointer border rounded"
            breakClassName="px-3 py-1"
            forcePage={safePage}
          />
        )}
      </div>

      {/* Delete dialogs: you already had AlertDialog components in your codebase; replace these with your existing dialog components if desired. */}
      {/* For brevity we keep simple window confirm here; adapt to your AlertDialog UI if you want prettier modals. */}

      {/* Individual Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete vendor {vendorToDelete?.vendorId} — {vendorToDelete?.name}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmIndividualDelete}
              className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
            >
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
              Delete {selected.size} selected vendors? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExpandedVendorDetails({ vendorId }) {
  const { data, isLoading, isError } = useVendor(vendorId);
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <div>Unable to load details.</div>;

  const { vendor, contacts = [], mappings = [] } = data;

  const itemLookup = Object.fromEntries(items.map((i) => [i.itemId, i]));
  const catLookup = Object.fromEntries(
    categories.map((c) => [c.categoryId, c.name])
  );
  const subcatLookup = Object.fromEntries(
    subcategories.map((s) => [s.subCategoryId, s.name])
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 border divide-x divide-y rounded-md overflow-hidden">
        {/* <div>
          <div className="text-sm text-muted-foreground">Vendor ID</div>
          <div className="font-medium">{vendor.vendorId}</div>
        </div> */}
        <div className="col-span-1 sm:col-span-2">
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            Address
          </div>
          <div className="p-1 text-wrap">{vendor.address || "-"}</div>
        </div>
        {/* <div>
          <div className="text-sm text-muted-foreground">Active</div>
          <div className=">{vendor.active ? "Yes" : "No"}</div>
        </div> */}
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            State
          </div>
          <div className="p-1">{vendor.state || "-"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            City
          </div>
          <div className="p-1">{vendor.city || "-"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            PinCode
          </div>
          <div className="p-1">{vendor.pinCode || "-"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            GST
          </div>
          <div className="p-1">{vendor.gst || "-"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            Phone
          </div>
          <div className="p-1">{vendor.phone || "-"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-1">
            Email
          </div>
          <div className="p-1">{vendor.email || "-"}</div>
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="p-4">
          <h4 className="font-medium">Vendor Contact Details</h4>
          {contacts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No contacts.</div>
          ) : (
            <div className="overflow-auto max-h-160 border rounded-md mt-2">
              <Table className="min-w-full table-auto border-collapse">
                <TableHeader>
                  <TableRow className="text-left">
                    <TableHead className="px-2 py-1">#</TableHead>
                    <TableHead className="px-2 py-1">Name</TableHead>
                    <TableHead className="px-2 py-1">Designation</TableHead>
                    <TableHead className="px-2 py-1">Phone</TableHead>
                    <TableHead className="px-2 py-1">Email</TableHead>
                    <TableHead className="px-2 py-1">Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c, i) => (
                    <TableRow key={c.contactId} className="border-t">
                      <TableCell className="px-2 py-1">{i + 1}</TableCell>
                      <TableCell className="px-2 py-1">{c.name}</TableCell>
                      <TableCell className="px-2 py-1">
                        {c.designation || "-"}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {c.phone || "-"}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {c.email || "-"}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {c.info || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="p-4">
          <h4 className="font-medium">Vendor Items</h4>
          {mappings.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No item mappings.
            </div>
          ) : (
            <div className="overflow-auto max-h-160 border rounded-md mt-2">
              <Table className="min-w-full table-auto border-collapse">
                <TableHeader>
                  <TableRow className="text-left">
                    <TableHead className="px-2 py-1">#</TableHead>
                    <TableHead className="px-2 py-1">Item Id</TableHead>
                    <TableHead className="px-2 py-1">Description</TableHead>
                    <TableHead className="px-2 py-1">Category</TableHead>
                    <TableHead className="px-2 py-1">Sub Category</TableHead>
                    <TableHead className="px-2 py-1">Price</TableHead>
                    <TableHead className="px-2 py-1">UOM (Per/-)</TableHead>
                    <TableHead className="px-2 py-1">Lead Time</TableHead>
                    <TableHead className="px-2 py-1">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m, i) => {
                    const item = itemLookup[m.itemId] || {};
                    const category = catLookup[item.categoryId] || "-";
                    const subcategory = subcatLookup[item.subCategoryId] || "-";
                    return (
                      <TableRow
                        key={m.mappingId}
                        className="border-t align-top"
                      >
                        <TableCell className="px-2 py-1">{i + 1}</TableCell>
                        <TableCell className="px-2 py-1">{m.itemId}</TableCell>
                        <TableCell className="px-2 py-1">
                          {item.description || item.name || "-"}
                        </TableCell>
                        <TableCell className="px-2 py-1">{category}</TableCell>
                        <TableCell className="px-2 py-1">
                          {subcategory}
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          {m.price ? `₹ ${m.price}` : "-"}
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          {m.uom || item.uom || "-"}
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          {m.leadTimeDays ? `${m.leadTimeDays} d` : "-"}
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          {m.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
