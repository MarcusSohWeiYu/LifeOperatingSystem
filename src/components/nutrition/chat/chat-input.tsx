"use client";

import { useRef, useState } from "react";
import { ImageIcon, SendIcon, UtensilsCrossedIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttachedFood } from "./types";

type Props = {
  disabled: boolean;
  stagedFood: AttachedFood | null;
  onSend: (text: string, imageDataUrl?: string, attachedFood?: AttachedFood) => void;
  onPickFood?: () => void;
  onClearFood: () => void;
};

export function ChatInput({ disabled, stagedFood, onSend, onPickFood, onClearFood }: Props) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function attachImage(file: File) {
    import("./image-utils").then(({ resizeImageToDataUrl }) => {
      resizeImageToDataUrl(file).then((dataUrl) => {
        setImagePreview(dataUrl);
      });
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    attachImage(file);
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item?.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) attachImage(file);
        return;
      }
    }
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview && !stagedFood) return;
    onSend(trimmed, imagePreview ?? undefined, stagedFood ?? undefined);
    setText("");
    setImagePreview(null);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const canSend = !disabled && (text.trim().length > 0 || imagePreview !== null || stagedFood !== null);

  return (
    <div className="border-t bg-background p-3 space-y-2">
      {/* Staged attachments */}
      <div className="flex flex-wrap gap-2">
        {imagePreview && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL, not optimizable */}
            <img
              src={imagePreview}
              alt="Attached"
              className="h-16 rounded-lg border"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-foreground/80 text-background p-0.5"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        )}

        {stagedFood && (
          <div className="relative inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 pr-7 text-xs">
            <div>
              <p className="font-medium text-sm leading-tight">{stagedFood.name}</p>
              <p className="text-muted-foreground">
                {stagedFood.calories} cal · P {stagedFood.proteinG}g · C {stagedFood.carbsG}g · F {stagedFood.fatG}g
                {stagedFood.servingSize ? ` · ${stagedFood.servingSize}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearFood}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-foreground/80 text-background p-0.5"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        {onPickFood && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPickFood}
            disabled={disabled}
            title="Import food"
          >
            <UtensilsCrossedIcon className="h-5 w-5" />
          </Button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageChange}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Describe your food or attach a photo..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          style={{ maxHeight: "120px", overflow: "auto" }}
        />

        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
