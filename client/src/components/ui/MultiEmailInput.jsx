import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cx } from "class-variance-authority";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function MultiEmailInput({
  value = [],
  onChange,
  placeholder = "Type email and press Enter",
  className,
  disabled,
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      addEmail();
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last email on backspace if input is empty
      const newValue = [...value];
      newValue.pop();
      onChange(newValue);
    }
  };

  const addEmail = () => {
    const email = inputValue.trim();
    if (!email) return;

    if (!isValidEmail(email)) {
      setError("Invalid email");
      return;
    }

    if (value.includes(email)) {
      setInputValue("");
      return; // duplicate
    }

    onChange([...value, email]);
    setInputValue("");
    setError(null);
  };

  const removeEmail = (emailToRemove) => {
    if (disabled) return;
    onChange(value.filter((email) => email !== emailToRemove));
  };

  return (
    <div className={cx("space-y-1", className)}>
      <div
        className={cx(
          "flex flex-wrap gap-2 items-center border rounded-md p-2 bg-background focus-within:ring-2 ring-indigo-500/20 transition-all",
          disabled && "opacity-60 cursor-not-allowed",
          error && "border-red-500"
        )}
      >
        {value.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              disabled={disabled}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[150px] placeholder:text-muted-foreground"
          placeholder={value.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => addEmail()} // Also add on blur
          disabled={disabled}
        />
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
