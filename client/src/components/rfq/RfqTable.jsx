import React, { useMemo, useState } from "react";
import { useRfqs } from "../../hooks/useRfq";
import ReactPaginate from "react-paginate";
import Select from "react-select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "../common/LoadingSpinner";
import { format } from "date-fns";
import { Ban, CircleCheckBig, CircleX, FileText } from "lucide-react";

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

export default function RfqTable() {
  const { data: rfqs = [], isLoading } = useRfqs();

  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize = 20;

  /* ----------------------------
     Vendor options
  ---------------------------- */
  const vendorOptions = useMemo(() => {
    const unique = [...new Set(rfqs.map((r) => r.vendorName))];
    return unique.map((v) => ({ label: v, value: v }));
  }, [rfqs]);

  /* ----------------------------
     Filtering
  ---------------------------- */
  const filtered = useMemo(() => {
    let data = rfqs;

    if (q) {
      const low = q.toLowerCase();
      data = data.filter(
        (r) =>
          r.rfqNo.toLowerCase().includes(low) ||
          r.vendorName.toLowerCase().includes(low)
      );
    }

    if (vendor) {
      data = data.filter((r) => r.vendorName === vendor.value);
    }

    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;

      data = data.filter((r) => {
        const createdAt = new Date(r.createdAt);

        if (from && createdAt < from) return false;
        if (to && createdAt > to) return false;

        return true;
      });
    }

    return data;
  }, [rfqs, q, vendor, fromDate, toDate]);
  /* ----------------------------
     Pagination
  ---------------------------- */
  const pageCount = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );
  const safePage =
    pageCount === 0 ? 0 : Math.min(currentPage, Math.max(pageCount - 1, 0));

  const showingFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const showingTo =
    filtered.length === 0
      ? 0
      : Math.min((safePage + 1) * pageSize, filtered.length);

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_min-content] gap-2 mb-4">
        <Input
          placeholder="Search RFQ No or Vendor"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCurrentPage(0);
          }}
        />

        <Select
          options={vendorOptions}
          value={vendor}
          onChange={(v) => {
            setVendor(v);
            setCurrentPage(0);
          }}
          isClearable
          placeholder="Filter Vendor"
          styles={customSelectStyles}
          menuPortalTarget={document.body}
        />

        <Input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(0);
          }}
        />

        <Input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(0);
          }}
        />

        <Button
          onClick={() => {
            setQ("");
            setVendor(null);
            setFromDate("");
            setToDate("");
          }}
          className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
        >
          Reset
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border max-h-160 overflow-auto mb-4 w-[87vw] sm:w-full">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>RFQ No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Email Status</TableHead>
              <TableHead>WhatsApp Status</TableHead>
              <TableHead>PDF</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No RFQs found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow
                  key={r.rfqNo}
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  <TableCell>
                    {format(r.createdAt, "dd MMM yyyy, hh:mm a")}
                  </TableCell>
                  <TableCell>{r.rfqNo}</TableCell>
                  <TableCell>{format(r?.date, "dd MMM yyyy")}</TableCell>
                  <TableCell>{r.vendorName}</TableCell>
                  <TableCell>
                    {r.emailStatus === "SENT" && (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        Sent
                        <CircleCheckBig className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {r.emailStatus === "NOT SENT" && (
                      <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                        Not Sent
                        <Ban className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {r.emailStatus === "FAILED" && (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        Failed
                        <CircleX className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.whatsappStatus === "SENT" && (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        Sent
                        <CircleCheckBig className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {r.whatsappStatus === "NOT SENT" && (
                      <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                        Not Sent
                        <Ban className="size-3" strokeWidth={3} />
                      </span>
                    )}
                    {r.whatsappStatus === "FAILED" && (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        Failed
                        <CircleX className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      className="text-red-600 underline"
                    >
                      <FileText className="size-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm order-1 sm:order-0 text-muted-foreground">
          Showing {showingFrom} to {showingTo} of {filtered.length} RFQs
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
    </div>
  );
}
