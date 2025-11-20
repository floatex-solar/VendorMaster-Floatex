// src/components/search/PinnedSection.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Eye, PinOff } from "lucide-react";
import { exportVendorsToExcel } from "../../utils/exportToExcel";

export default function PinnedSection({ pinnedData, onUnpin, onView }) {
  const handleExport = () => {
    exportVendorsToExcel(pinnedData);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Pinned Items ({pinnedData.length})
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pinnedData.map((p) => (
          <div key={p.item.itemId} className="p-4 border rounded bg-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground">
                  {p.item.itemId} • {p.item.uomName}
                </div>
                <div className="text-lg font-semibold">
                  {p.item.description}
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.item.categoryName} › {p.item.subCategoryName}
                </div>
                <div className="text-sm mt-1">{p.vendors.length} vendors</div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onView(p)}>
                  <Eye size={16} />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onUnpin(p.pinId)}
                >
                  <PinOff size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
