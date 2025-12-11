import * as React from "react";
import { cn } from "@/lib/utils";

interface NumInputProps extends React.ComponentProps<"input"> {
  value: string | number | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumInput = React.forwardRef<HTMLInputElement, NumInputProps>(
  ({ className, type = "text", value, onChange, ...props }, ref) => {

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === "0") e.target.select();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Keep empty string if user deletes text
      if (e.target.value.trim() === "") {
        onChange({
          ...e,
          target: { ...e.target, value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={value ?? ""}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

NumInput.displayName = "NumInput";

export { NumInput };
