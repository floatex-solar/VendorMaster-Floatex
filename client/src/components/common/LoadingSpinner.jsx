import React from "react";
import { Spinner } from "@/components/ui/spinner";

function LoadingSpinner({
  text = "Loading...",
  className = "",
  showIcon = true,
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-center gap-2">
        {showIcon && <Spinner />}
        {text}
      </div>
    </div>
  );
}

export default LoadingSpinner;
