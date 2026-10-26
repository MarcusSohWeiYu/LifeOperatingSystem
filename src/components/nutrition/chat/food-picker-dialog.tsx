"use client";

import { useRef, useState } from "react";
import { BookmarkIcon, SearchIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchFoods, getFoodDetails } from "@/actions/nutrition";
import type { FoodSearchResult } from "@/actions/nutrition";
import type { SavedFood } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedFoods: SavedFood[];
  onSelect: (description: string) => void;
};

function formatFoodDescription(food: {
  name: string;
  brand?: string;
  servingSize?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}): string {
  const parts = [food.name];
  if (food.brand) parts.push(`(${food.brand})`);
  parts.push(`— ${food.calories} cal`);
  parts.push(`P: ${food.proteinG}g`);
  parts.push(`C: ${food.carbsG}g`);
  parts.push(`F: ${food.fatG}g`);
  if (food.servingSize) parts.push(`per ${food.servingSize}`);
  return parts.join(" ");
}

type SearchStatus = "idle" | "loading" | "results" | "empty" | "error";

function SearchPanel({ onSelect }: { onSelect: (desc: string) => void }) {
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
      onSelect(formatFoodDescription({
        name: result.name,
        brand: result.brand,
        calories: result.calories,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      }));
      return;
    }
    onSelect(formatFoodDescription(res.food));
  }

  return (
    <div className="space-y-3 pt-3">
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

      <div className="overflow-y-auto max-h-[40vh]">
        {status === "idle" && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Search for a food to ask the AI about
          </p>
        )}

        {status === "loading" && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
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
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {status === "error" && (
          <p className="text-xs text-destructive text-center py-8">
            {errorMsg || "Search failed"}
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

function SavedPanel({ savedFoods, onSelect }: { savedFoods: SavedFood[]; onSelect: (desc: string) => void }) {
  if (savedFoods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookmarkIcon className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No saved foods</p>
        <p className="text-xs text-muted-foreground mt-1">
          Bookmark foods from your nutrition log to use them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 pt-2 max-h-[40vh] overflow-y-auto">
      {savedFoods.map((food) => (
        <button
          key={food.id}
          type="button"
          className="w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 text-left transition-colors"
          onClick={() => onSelect(formatFoodDescription(food))}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{food.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {food.brand ? `${food.brand} · ` : ""}
              {food.servingSize || "1 serving"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums shrink-0">
            <span>{food.calories} cal</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function FoodPickerDialog({ open, onOpenChange, savedFoods, onSelect }: Props) {
  const defaultTab = savedFoods.length > 0 ? "saved" : "search";

  function handleSelect(description: string) {
    onSelect(description);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Import Food to Chat</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <div className="px-4">
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="saved" className="flex-1 gap-1">
                <BookmarkIcon className="h-3.5 w-3.5" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="search" className="flex-1 gap-1">
                <SearchIcon className="h-3.5 w-3.5" />
                Search
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="px-4 pb-4">
            <SavedPanel savedFoods={savedFoods} onSelect={handleSelect} />
          </TabsContent>

          <TabsContent value="search" className="px-4 pb-4">
            <SearchPanel onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
