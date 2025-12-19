import { Button } from "@/components/ui/button";
import RfqTable from "../components/rfq/RfqTable";

export default function RfqPage() {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-indigo-600">
          RFQ (Request For Quotations)
        </h1>
      </div>

      <RfqTable />
    </div>
  );
}
