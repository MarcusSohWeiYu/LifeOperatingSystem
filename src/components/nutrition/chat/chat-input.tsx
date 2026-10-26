"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, MicIcon, MicOffIcon, SendIcon, UtensilsCrossedIcon, XIcon } from "lucide-react";
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
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stoppedManuallyRef = useRef(false);
  const processedRef = useRef(0);

  function toggleSpeech() {
    if (listening) {
      stoppedManuallyRef.current = true;
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stoppedManuallyRef.current = false;
    processedRef.current = 0;

    function startRecognition() {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-SG";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const parts: string[] = [];
        for (let i = processedRef.current; i < event.results.length; i++) {
          const transcript = event.results[i]?.[0]?.transcript?.trim();
          if (transcript) parts.push(transcript);
        }
        processedRef.current = event.results.length;
        const chunk = parts.join(" ");
        if (chunk) {
          setText((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      };
      recognition.onend = () => {
        processedRef.current = 0;
        if (!stoppedManuallyRef.current) {
          try {
            startRecognition();
            return;
          } catch {
            // restart failed
          }
        }
        setListening(false);
      };
      recognition.onerror = (e: Event) => {
        const err = e as Event & { error?: string };
        if (err.error === "no-speech" && !stoppedManuallyRef.current) {
          return;
        }
        stoppedManuallyRef.current = true;
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    startRecognition();
    setListening(true);
  }

  const [hasSpeech] = useState(() =>
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  );

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

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview && !stagedFood) return;
    onSend(trimmed, imagePreview ?? undefined, stagedFood ?? undefined);
    setText("");
    setImagePreview(null);
    // Reset height after clearing
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = "auto";
    });
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
      {/* Listening indicator */}
      {listening && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Listening — speak now...
          </span>
          <button
            type="button"
            onClick={toggleSpeech}
            className="ml-auto text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Stop
          </button>
        </div>
      )}

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

        {hasSpeech && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSpeech}
            disabled={disabled}
            title={listening ? "Stop listening" : "Voice input"}
            className={listening ? "text-red-500 animate-pulse" : ""}
          >
            {listening ? <MicOffIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
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
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Describe your food..."
          disabled={disabled}
          rows={1}
          className={`flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${listening ? "border-red-500/50 ring-1 ring-red-500/30" : ""}`}
          style={{ overflow: "hidden" }}
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
