"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanState = "initializing" | "scanning" | "error";

type Props = {
  active: boolean;
  loading: boolean;
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

export function BarcodeScannerTab({ active, loading, onDetected, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDetectedRef = useRef(false);
  // State starts as "initializing" from fresh mount (parent passes key= to remount on each activation)
  const [scanState, setScanState] = useState<ScanState>("initializing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!active) return;

    hasDetectedRef.current = false;
    let quagga: typeof import("@ericblade/quagga2").default | null = null;
    let stopped = false;

    async function start() {
      try {
        const mod = await import("@ericblade/quagga2");
        quagga = mod.default;
        if (stopped) return;

        await new Promise<void>((resolve, reject) => {
          quagga!.init(
            {
              inputStream: {
                type: "LiveStream",
                constraints: { facingMode: "environment" },
                target: containerRef.current ?? undefined,
              },
              decoder: { readers: ["ean_reader", "upc_reader"] },
              locate: true,
            },
            (err: Error | null) => {
              if (err) reject(err);
              else resolve();
            },
          );
        });

        if (stopped) {
          quagga.stop();
          return;
        }

        quagga.start();
        setScanState("scanning");

        quagga.onDetected((result) => {
          if (hasDetectedRef.current) return;
          const codes = result.codeResult.decodedCodes;
          const errors = codes
            .filter((c) => c.error !== undefined)
            .map((c) => c.error as number);
          const avgError = errors.length > 0
            ? errors.reduce((a, b) => a + b, 0) / errors.length
            : 1;
          if (avgError > 0.1) return;
          hasDetectedRef.current = true;
          onDetected(result.codeResult.code ?? "");
        });
      } catch (err) {
        if (stopped) return;
        const msg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera permissions and try again."
            : err instanceof Error && err.name === "NotFoundError"
              ? "No camera found on this device."
              : "Could not start camera. Please try again.";
        setErrorMsg(msg);
        setScanState("error");
      }
    }

    start();

    return () => {
      stopped = true;
      if (quagga) {
        try {
          quagga.stop();
          quagga.offDetected(() => {});
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Viewfinder */}
      <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
        <div ref={containerRef} className="absolute inset-0" />

        {scanState === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-sm">Starting camera…</p>
          </div>
        )}

        {scanState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
            <p className="text-white text-sm">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              <XIcon className="h-3.5 w-3.5 mr-1.5" />
              Close
            </Button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-white text-sm">Looking up product…</p>
          </div>
        )}

        {scanState === "scanning" && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-28 relative">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 text-center text-xs text-muted-foreground">
        {scanState === "scanning" && !loading && "Point at the barcode on the packaging"}
        {loading && "Found barcode — looking up nutrition data…"}
      </div>
    </div>
  );
}
