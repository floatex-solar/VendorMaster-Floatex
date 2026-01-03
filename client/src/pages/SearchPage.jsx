import React, { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, Pin as PinIcon, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchResultDialog from "../components/search/SearchResultDialog";
import PinnedSection from "../components/search/PinnedSection";
import { useSearch } from "../hooks/useSearch";
import { usePinned, useCreatePin, useDeletePin } from "../hooks/usePinned";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useCategories, useSubCategories } from "../hooks/useCategories";
import Select from "react-select";
import { customSelectStyles } from "../utils/customSelectStyles";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import RfqItemDetailsModal from "../components/rfq/RfqItemDetailsModal";
import RfqVendorTabsModal from "../components/rfq/RfqVendorTabsModal";

/* ----------------------------------
   API helper
-----------------------------------*/
async function fetchVendorsByItemId(itemId) {
  const api = (await import("../lib/api")).default;
  const res = await api.get(`/items/${itemId}/vendors`);
  return res.data || [];
}

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState([]);

  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const [rfqItemModalOpen, setRfqItemModalOpen] = useState(false);
  const [rfqVendorModalOpen, setRfqVendorModalOpen] = useState(false);
  const [rfqItems, setRfqItems] = useState([]);

  const queryClient = useQueryClient();

  /* ----------------------------------
     Queries
  -----------------------------------*/
  const searchQuery = useSearch({
    keyword: term,
    categoryId: selectedCategory,
    subCategoryId: selectedSubCategory,
  });

  const pinnedQuery = usePinned();
  const createPin = useCreatePin();
  const deletePin = useDeletePin();

  const pinned = pinnedQuery.data || [];

  /* ----------------------------------
     Sync search results
  -----------------------------------*/
  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
    }
  }, [searchQuery.data]);

  /* ----------------------------------
     🔥 useQueries for vendors
  -----------------------------------*/
  const vendorQueries = useQueries({
    queries: pinned.map((p) => ({
      queryKey: ["vendors", p.itemId],
      queryFn: () => fetchVendorsByItemId(p.itemId),
      enabled: !!p.itemId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  /* ----------------------------------
     Merge pinned + vendors
  -----------------------------------*/
  const pinnedDetailed = useMemo(() => {
    return pinned.map((p, index) => {
      const q = vendorQueries[index];

      return {
        item: {
          itemId: p.itemId,
          description: p.itemDescription,
          categoryName: p.categoryName,
          subCategoryName: p.subCategoryName,
          uomName: p.uomName,
        },
        ...(q?.data ?? []),
        isLoadingVendors: q?.isLoading ?? true,
        pinId: p.pinId,
        pinned: true,
      };
    });
  }, [pinned, vendorQueries]);

  /* ----------------------------------
     Handlers
  -----------------------------------*/
  function handleResetFilters() {
    setTerm("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedData(null);
    setResults([]);
    queryClient.removeQueries({ queryKey: ["search"] });
  }

  function openDialogFor(data) {
    setSelectedData(data);
    setDialogOpen(true);
  }

  function openDialogForPinned(data) {
    setSelectedData(data);
    setDialogOpen(true);
  }

  async function handlePin(data) {
    const existing = pinned.find((p) => p.itemId === data.item.itemId);

    if (existing) {
      await deletePin.mutateAsync(existing.pinId);
      return;
    }

    await createPin.mutateAsync({
      itemId: data.item.itemId,
      itemDescription: data.item.description,
      categoryName: data.item.categoryName,
      subCategoryName: data.item.subCategoryName,
      uomName: data.item.uomName,
      searchTerm: term || data.item.description,
    });
  }

  async function handleUnpin(pinId) {
    await deletePin.mutateAsync(pinId);
  }

  /* ----------------------------------
     Select options
  -----------------------------------*/
  const categoryOptions = categories.map((c) => ({
    value: c.categoryId,
    label: c.name,
  }));

  const subOptions = subcategories
    .filter((s) => !selectedCategory || s.categoryId === selectedCategory)
    .map((s) => ({
      value: s.subCategoryId,
      label: s.name,
    }));

  /* ----------------------------------
     Render
  -----------------------------------*/
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-600">Search Vendors</h1>
        <p className="text-muted-foreground text-sm">
          Type a keyword and search items
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[5fr_2fr_2fr_auto_auto] gap-2 mb-6">
        <div className="relative flex items-center">
          <SearchIcon
            className="absolute ml-3 text-muted-foreground"
            size={18}
          />
          <Input
            className="pl-10"
            placeholder="Search items..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchQuery.refetch()}
          />
        </div>

        <Select
          placeholder="Filter Category"
          options={categoryOptions}
          isClearable
          value={
            selectedCategory
              ? categoryOptions.find((o) => o.value === selectedCategory)
              : null
          }
          onChange={(o) => {
            setSelectedCategory(o?.value || "");
            setSelectedSubCategory("");
          }}
          styles={customSelectStyles("36px")}
        />

        <Select
          placeholder="Filter Sub-category"
          options={subOptions}
          isClearable
          value={
            selectedSubCategory
              ? subOptions.find((o) => o.value === selectedSubCategory)
              : null
          }
          onChange={(o) => setSelectedSubCategory(o?.value || "")}
          styles={customSelectStyles("36px")}
        />

        <Button
          onClick={() => searchQuery.refetch()}
          disabled={!term || searchQuery.isFetching}
        >
          Search
        </Button>

        <Button variant="destructive" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>

      {/* Search Results */}
      <div className="mb-6">
        {searchQuery.isLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : results.length === 0 ? (
          term && (
            <div className="py-8 text-center text-muted-foreground">
              No results for "{term}"
            </div>
          )
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((r) => (
              <div key={r.item.itemId} className="p-4 border rounded bg-card">
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {r.item.itemId} • {r.item.uomName}
                    </div>
                    <div className="text-lg font-semibold">
                      {r.item.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.item.categoryName} › {r.item.subCategoryName}
                    </div>
                    <div className="text-xs mt-1 bg-indigo-600 text-white rounded-full w-fit px-2">
                      {(r.vendors || []).length} vendors
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialogFor(r)}
                    >
                      <Eye />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pinned.some((p) => p.itemId === r.item.itemId)}
                      onClick={() => handlePin(r)}
                    >
                      <PinIcon />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Section */}
      {pinnedDetailed.length > 0 && (
        <PinnedSection
          pinnedData={pinnedDetailed}
          onUnpin={handleUnpin}
          onView={openDialogForPinned}
          onCreateRfq={() => setRfqItemModalOpen(true)}
        />
      )}

      {/* Dialogs */}
      <SearchResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={selectedData}
        onPin={handlePin}
        isPinned={
          selectedData &&
          pinned.some((p) => p.itemId === selectedData.item.itemId)
        }
      />

      {rfqItemModalOpen && (
        <RfqItemDetailsModal
          open={rfqItemModalOpen}
          onOpenChange={setRfqItemModalOpen}
          pinnedItems={pinnedDetailed}
          onUnpin={handleUnpin}
          onProceed={(items) => {
            setRfqItems(items);
            setRfqVendorModalOpen(true);
          }}
        />
      )}

      {rfqVendorModalOpen && (
        <RfqVendorTabsModal
          open={rfqVendorModalOpen}
          onOpenChange={setRfqVendorModalOpen}
          rfqItems={rfqItems}
        />
      )}
    </div>
  );
}
