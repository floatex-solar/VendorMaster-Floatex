export const customSelectStyles = (height = "34px") => {
  return {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    control: (provided) => ({
      ...provided,
      minHeight: height,
      height: height,
      borderColor: "oklch(0.922 0 0)",
      borderRadius: "0.375rem",
      boxShadow:
        "var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 1px 2px 0 rgb(0 0 0 / 0.05)",
      fontSize: "0.875rem",
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: height,
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
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "0.875rem",
      padding: "6px 10px",
      backgroundColor: state.isFocused ? "oklch(0.97 0 0)" : "transparent",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: height,
    }),
  };
};
