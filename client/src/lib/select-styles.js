// src/lib/select-styles.js
export const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "black",
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
