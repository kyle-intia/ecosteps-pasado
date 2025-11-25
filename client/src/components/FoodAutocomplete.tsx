import { useState, useEffect, useRef } from "react";
import { FOOD_BY_CATEGORY, FoodCategory } from "../lib/foodData";
import { Input } from "@/components/ui/input";
import { Command, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import * as Popover from "@radix-ui/react-popover";

interface FoodItem {
  id: string | number;
  name: string;
}

interface Props {
  category: FoodCategory | "";
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  maxDropdownHeight?: number;
}

export function FoodAutocomplete({
  category,
  value,
  onChange,
  disabled,
  size = "md",
  maxDropdownHeight = 240,
}: Props) {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFoods = async (query: string, signal?: AbortSignal) => {
    if (!query) return;
    setLoading(true);
    setFetchFailed(false);

    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`, { signal });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      const foods: FoodItem[] =
        data.foods?.map((f: any, index: number) =>
          typeof f === "string" ? { id: `${f}-${index}`, name: f } : { id: f.food_id, name: f.food_name }
        ) ?? [];

      setResults(foods);
      setHighlightIndex(0);
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        setResults([]);
        setFetchFailed(true);
        setHighlightIndex(0);
      }
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const controller = new AbortController();

  debounceRef.current = setTimeout(async () => {
    if (value.length >= 2) {
      let localResults: FoodItem[] = [];
      if (category) {
        localResults = FOOD_BY_CATEGORY[category]
          .filter((f) => f.toLowerCase().includes(value.toLowerCase()))
          .map((f, index) => ({ id: `local-${f}-${index}`, name: f }));
      }

      if (localResults.length > 0) {
        setResults(localResults);
        setFetchFailed(false);
        setHighlightIndex(0);
      }

      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();
        const apiResults: FoodItem[] =
          data.foods?.map((f: any, index: number) =>
            typeof f === "string" ? { id: `api-${f}-${index}`, name: f } : { id: f.food_id, name: f.food_name }
          ) ?? [];

        // Merge local + API, making sure local is on top
        const merged = [...localResults, ...apiResults.filter((api) => !localResults.some((l) => l.name === api.name))];

        setResults(merged);
        setFetchFailed(false);
        setHighlightIndex(0);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          if (localResults.length === 0) setResults([]);
          setFetchFailed(true);
          setHighlightIndex(0);
        }
      }
    } else {
      setResults([]);
      setFetchFailed(false);
    }
  }, 300);

  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    controller.abort();
  };
}, [value, category]);



const displayedResults =
  results.length > 0
    ? results
    : fetchFailed && category
    ? FOOD_BY_CATEGORY[category].map((f, index) => ({
        id: `fallback-${f}-${index}`,
        name: f,
      }))
    : [];

  const handleSelect = (item: FoodItem) => {
    onChange(item.name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, displayedResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayedResults[highlightIndex]) handleSelect(displayedResults[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const sizeClasses = {
    sm: "py-1 px-2 text-sm",
    md: "py-2 px-3 text-base",
    lg: "py-3 px-4 text-lg",
  };

  return (
<Popover.Root open={open} onOpenChange={setOpen}>
  {/* Popover Trigger */}
  <Popover.Trigger asChild>
    <button
      type="button"
      className={`w-full text-left border rounded px-3 py-2 ${
        disabled ? "bg-gray-100" : "bg-white"
      }`}
      disabled={disabled}
    >
      {value || (category ? `Search ${category} foods` : "Select food")}
    </button>
  </Popover.Trigger>

  {/* Popover Content */}
  <Popover.Portal>
    <Popover.Content
      side="bottom" 
      align="start"
      sideOffset={4}
      className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[400px] overflow-auto"
    >
      {/* Input inside popover */}
      <Input
        ref={inputRef}
        value={value}
        className={sizeClasses[size]}
        placeholder={category ? `Search ${category} foods` : "Type to search"}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />

<div className="mt-2">
  <Command>
    <CommandList>
      {loading && <CommandEmpty>Searching...</CommandEmpty>}

      {!loading && displayedResults.length === 0 && (
        <CommandEmpty>
          {fetchFailed && category
            ? "Fetch failed, showing fallback options"
            : "No results"}
        </CommandEmpty>
      )}

      {displayedResults.map((item, index) => {
        const isLocal = item.id.startsWith("local") || item.id.startsWith("fallback");
        return (
          <CommandItem
            key={item.id}
            onSelect={() => handleSelect(item)}
            className={`cursor-pointer ${
              highlightIndex === index
                ? "bg-blue-500 text-white"
                : isLocal
                ? "bg-gray-50"
                : "bg-white"
            }`}
          >
            {item.name} {!isLocal && <span className="text-gray-400 text-xs ml-2">(API)</span>}
          </CommandItem>
        );
      })}
    </CommandList>
  </Command>
</div>

    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
  );
}
