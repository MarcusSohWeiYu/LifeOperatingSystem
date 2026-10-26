"use client";

import { useRef, useState } from "react";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disabled: boolean;
  onSend: (text: string, imageDataUrl?: string) => void;
};

export function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Import dynamically to keep bundle small
    import("./image-utils").then(({ resizeImageToDataUrl }) => {
      resizeImageToDataUrl(file).then((dataUrl) => {
        setImagePreview(dataUrl);
      });
    });

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;
    onSend(trimmed, imagePreview ?? undefined);
    setText("");
    setImagePreview(null);
    // Refocus textarea
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const canSend = !disabled && (text.trim().length > 0 || imagePreview !== null);

  return (
    <div className="border-t bg-background p-3 space-y-2">
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

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

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
          placeholder="Describe your food or attach a photo..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
