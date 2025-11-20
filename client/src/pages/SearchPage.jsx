// src/pages/SearchPage.jsx
import React, { useState, useEffect } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [pinnedDetailed, setPinnedDetailed] = useState([]);
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubCategories();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const queryClient = useQueryClient();

  function handleResetFilters() {
    setTerm("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedData(null);
    setResults([]);

    // Reset query results
    queryClient.removeQueries({ queryKey: ["search"] });
  }

  const isResetDisabled = !term && !selectedCategory && !selectedSubCategory;

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

  const searchQuery = useSearch({
    keyword: term,
    categoryId: selectedCategory,
    subCategoryId: selectedSubCategory,
  });

  const pinnedQuery = usePinned();
  const createPin = useCreatePin();
  const deletePin = useDeletePin();

  function openDialogForPinned(data) {
    setSelectedData(data);
    setDialogOpen(true);
  }

  // When search result changes, update results local state
  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
    }
  }, [searchQuery.data]);

  // load detailed pinned items: for each pin, call search to get its latest data
  useEffect(() => {
    async function loadPinnedDetails() {
      const pins = pinnedQuery.data || [];
      // for each pin, call search API with pin.searchTerm (or fetch item by id if you have API)
      const api = await import("../lib/api").then((m) => m.default);
      const resultsArr = [];
      for (const p of pins) {
        try {
          const resp = await api.get("/search/items", {
            params: { q: p.itemDescription || p.itemId },
          });
          const found = (resp.data || []).find(
            (r) => r.item.itemId === p.itemId
          );
          if (found) {
            // attach pinId
            found.pinId = p.pinId;
            found.pinned = true;
            resultsArr.push(found);
          } else {
            // item not found this time: create a minimal record based on pin
            resultsArr.push({
              item: {
                itemId: p.itemId,
                description: p.itemDescription,
                categoryName: "",
                subCategoryName: "",
                uomName: "",
              },
              vendors: [],
              pinId: p.pinId,
              pinned: true,
            });
          }
        } catch (err) {
          console.error("Error fetching pinned item search", err);
        }
      }
      setPinnedDetailed(resultsArr);
    }
    loadPinnedDetails();
  }, [pinnedQuery.data]);

  function openDialogFor(data) {
    setSelectedData(data);
    setDialogOpen(true);
  }

  async function handlePin(data) {
    // If pinned → unpin
    const existing = pinned.find((p) => p.itemId === data.item.itemId);
    if (existing) {
      await deletePin.mutateAsync(existing.pinId);
      return;
    }

    // Else → pin
    await createPin.mutateAsync({
      itemId: data.item.itemId,
      itemDescription: data.item.description,
      searchTerm: term || data.item.description,
    });
  }

  async function handleUnpin(pinId) {
    try {
      await deletePin.mutateAsync(pinId);
    } catch (err) {
      console.error("Unpin error", err);
    }
  }

  const pinned = pinnedQuery.data || [];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-600">Search Vendors</h1>
        <p className="text-muted-foreground text-sm">
          Type a keyword (item description, category, subcategory or UOM) and
          press Search
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[5fr_2fr_2fr_min-content_min-content] gap-2 mb-6">
        <div className="flex-1 relative flex items-center">
          <SearchIcon
            className="absolute ml-3 text-muted-foreground"
            size={18}
          />
          <Input
            className="pl-10"
            placeholder="Search items..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchQuery.refetch();
            }}
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
          className="text-xs md:text-sm"
          classNamePrefix="react-select"
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
          className="text-xs md:text-sm"
          classNamePrefix="react-select"
          styles={customSelectStyles("36px")}
        />
        <Button
          onClick={() => searchQuery.refetch()}
          disabled={!term || searchQuery.isFetching}
        >
          {searchQuery.isFetching ? "Searching..." : "Search"}
        </Button>
        <Button
          variant="destructive"
          onClick={handleResetFilters}
          className="px-4"
        >
          Reset
        </Button>
      </div>

      {/* Search results */}
      <div className="mb-6">
        {searchQuery.isLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : results.length === 0 ? (
          term ? (
            <div className="py-8 text-center text-muted-foreground">
              No results for "{term}"
            </div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="text-xs text-muted-foreground">
                      {r.item.categoryName} › {r.item.subCategoryName}
                    </div>
                    <div className="text-sm mt-1 bg-indigo-600 text-white rounded-full w-fit px-2">
                      {(r.vendors || []).length} vendor
                      {(r.vendors || []).length !== 1 ? "s" : ""}
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
                      onClick={() => handlePin(r)}
                      disabled={pinned.some((p) => p.itemId === r.item.itemId)}
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

      {/* Pinned section */}
      {pinnedDetailed.length > 0 && (
        <PinnedSection
          pinnedData={pinnedDetailed}
          onUnpin={(pinId) => handleUnpin(pinId)}
          onView={openDialogForPinned}
        />
      )}

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
    </div>
  );
}
