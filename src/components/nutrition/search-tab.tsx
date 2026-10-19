"use client";

import { useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchFoods, getFoodDetails } from "@/actions/nutrition";
import type { FoodProduct, FoodSearchResult } from "@/actions/nutrition";

type SearchStatus = "idle" | "loading" | "results" | "empty" | "error";

type Props = {
  onSelect: (product: FoodProduct) => void;
};

export function SearchTab({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function performSearch(q: string) {
    const res = await searchFoods(q);
    if (!res.ok) {
      setErrorMsg(res.error);
      setStatus("error");
      return;
    }
    setResults(res.results);
    setStatus(res.results.length > 0 ? "results" : "empty");
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timerRef.current = setTimeout(() => { performSearch(value); }, 300);
  }

  function handleClear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  async function handleSelect(result: FoodSearchResult) {
    setLoadingId(result.foodId);
    const res = await getFoodDetails(result.foodId);
    setLoadingId(null);
    if (!res.ok) {
      // Fall back to basic info from search result
      onSelect({
        name: result.name,
        brand: result.brand,
        servingSize: "1 serving",
        calories: result.calories,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      });
      return;
    }
    onSelect(res.food);
  }

  return (
    <div className="space-y-3 pt-3">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 pr-8"
          placeholder="Search foods…"
          value={query}
          autoFocus
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Results area */}
      <div className="overflow-y-auto max-h-[40vh]">
        {status === "idle" && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Type to search the food database
          </p>
        )}

        {status === "loading" && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between px-1 py-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        )}

        {status === "empty" && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No results found for &ldquo;{query}&rdquo;
          </p>
        )}

        {status === "error" && (
          <p className="text-xs text-destructive text-center py-8">
            {errorMsg || "Search failed. Check your connection and try again."}
          </p>
        )}

        {status === "results" && (
          <div className="divide-y">
            {results.map((result) => (
              <button
                key={result.foodId}
                type="button"
                disabled={loadingId !== null}
                className="w-full flex items-center justify-between px-1 py-2.5 text-left hover:bg-muted/50 rounded-sm transition-colors disabled:opacity-60"
                onClick={() => handleSelect(result)}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-medium truncate">{result.name}</p>
                  {result.brand && (
                    <p className="text-xs text-muted-foreground truncate">{result.brand}</p>
                  )}
                </div>
                {loadingId === result.foodId ? (
                  <span className="text-xs text-muted-foreground shrink-0">Loading…</span>
                ) : (
                  <span className="text-sm tabular-nums shrink-0">
                    {result.calories > 0 ? `${result.calories} cal` : "—"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
