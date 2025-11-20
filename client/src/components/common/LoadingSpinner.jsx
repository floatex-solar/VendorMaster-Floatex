import React from "react";
import { Spinner } from "@/components/ui/spinner";

function LoadingSpinner() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2">
        <Spinner />
        Loading...
      </div>
    </div>
  );
}

export default LoadingSpinner;
