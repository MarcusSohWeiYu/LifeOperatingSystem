"use client";

import { useState } from "react";
import { ScanBarcodeIcon, SearchIcon, SparklesIcon, ZapIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { MEAL_LABELS } from "./types";
import type { FoodEntry, MealType } from "./types";
import type { FoodProduct } from "@/actions/nutrition";
import { SearchTab } from "./search-tab";
import { QuickAddTab } from "./quick-add-tab";
import { BarcodeScannerTab } from "./barcode-scanner-tab";
import { AiScanTab } from "./ai-scan-tab";

export type AddFoodTab = "search" | "quick-add" | "scan" | "ai";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealType;
  initialTab?: AddFoodTab;
  onSelectProduct: (product: FoodProduct) => void;
  onQuickAddSave: (entry: Omit<FoodEntry, "id">) => void;
  scanLoading: boolean;
  onBarcodeDetected: (barcode: string) => void;
};

export function AddFoodDialog({
  open,
  onOpenChange,
  meal,
  initialTab,
  onSelectProduct,
  onQuickAddSave,
  scanLoading,
  onBarcodeDetected,
}: Props) {
  const [activeTab, setActiveTab] = useState<AddFoodTab>(initialTab ?? "search");
  // Increment to remount the scanner on each activation (fresh camera + clean state)
  const [scanKey, setScanKey] = useState(0);

  function handleTabChange(value: string) {
    const tab = value as AddFoodTab;
    if (tab === "scan") setScanKey((k) => k + 1);
    setActiveTab(tab);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Add to {MEAL_LABELS[meal]}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="px-4">
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="search" className="flex-1 gap-1">
                <SearchIcon className="h-3.5 w-3.5" />
                Search
              </TabsTrigger>
              <TabsTrigger value="quick-add" className="flex-1 gap-1">
                <ZapIcon className="h-3.5 w-3.5" />
                Quick
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex-1 gap-1">
                <ScanBarcodeIcon className="h-3.5 w-3.5" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 gap-1">
                <SparklesIcon className="h-3.5 w-3.5" />
                AI
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="search" className="px-4 pb-4">
            <SearchTab onSelect={onSelectProduct} />
          </TabsContent>

          <TabsContent value="quick-add" className="px-4 pb-4">
            <QuickAddTab
              meal={meal}
              onSave={onQuickAddSave}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="scan">
            <BarcodeScannerTab
              key={scanKey}
              active={activeTab === "scan"}
              loading={scanLoading}
              onDetected={onBarcodeDetected}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="ai" className="px-4 pb-4">
            <AiScanTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
