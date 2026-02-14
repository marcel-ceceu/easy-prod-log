import { useRef, useState, useMemo } from "react";
import { useZxing } from "react-zxing";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { Flashlight, FlashlightOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ProdutoReferencia = Tables<"produtos_referencia">;

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (produto: ProdutoReferencia, codbarra: string) => void;
  onNotFound: () => void;
  onError: (err: Error) => void;
}

/* ── Scanning overlay with mask, corners, animated line ── */
const ScanOverlay = ({ scanned }: { scanned: boolean }) => {
  // The "window" is 80% wide, ~25% tall, centered
  const cutout = {
    width: "80%",
    height: "28%",
    top: "36%",
    left: "10%",
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dark mask with transparent cutout using clip-path */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% ${cutout.top},
            ${cutout.left} ${cutout.top},
            ${cutout.left} calc(${cutout.top} + ${cutout.height}),
            calc(${cutout.left} + ${cutout.width}) calc(${cutout.top} + ${cutout.height}),
            calc(${cutout.left} + ${cutout.width}) ${cutout.top},
            0% ${cutout.top}
          )`,
        }}
      />

      {/* Corner brackets */}
      {(() => {
        const s = 20; // bracket size px
        const bw = 3; // border width px
        const style = `${bw}px solid white`;
        const corners = [
          { top: cutout.top, left: cutout.left, borderTop: style, borderLeft: style },
          { top: cutout.top, right: cutout.left, borderTop: style, borderRight: style },
          { bottom: `calc(100% - ${cutout.top} - ${cutout.height})`, left: cutout.left, borderBottom: style, borderLeft: style },
          { bottom: `calc(100% - ${cutout.top} - ${cutout.height})`, right: cutout.left, borderBottom: style, borderRight: style },
        ];
        return corners.map((pos, i) => (
          <div
            key={i}
            className="absolute"
            style={{ width: s, height: s, ...pos } as React.CSSProperties}
          />
        ));
      })()}

      {/* Animated scan line */}
      <div
        className="absolute"
        style={{
          left: cutout.left,
          width: cutout.width,
          top: cutout.top,
          height: cutout.height,
          overflow: "hidden",
        }}
      >
        <div
          className="absolute left-0 w-full h-0.5 bg-red-500/80"
          style={{
            animation: "scan-line 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Success flash */}
      {scanned && (
        <div
          className="absolute inset-0 bg-green-500/30"
          style={{ animation: "flash-out 400ms ease-out forwards" }}
        />
      )}

      {/* Instruction text */}
      <p
        className="absolute text-white text-xs text-center w-full"
        style={{ top: `calc(${cutout.top} + ${cutout.height} + 12px)` }}
      >
        Posicione o código de barras dentro do retângulo
      </p>

      {/* Keyframes */}
      <style>{`
        @keyframes scan-line {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        @keyframes flash-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* ── Inner scanner component ── */
const ScannerView = ({
  onProductFound,
  onNotFound,
  onError,
  onDone,
}: {
  onProductFound: (produto: ProdutoReferencia, codbarra: string) => void;
  onNotFound: () => void;
  onError: (err: Error) => void;
  onDone: () => void;
}) => {
  const lastScannedRef = useRef<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const hints = useMemo(() => {
    const map = new Map();
    map.set(DecodeHintType.TRY_HARDER, true);
    map.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
    ]);
    return map;
  }, []);

  const { ref, torch } = useZxing({
    timeBetweenDecodingAttempts: 250,
    hints,
    onResult: async (result) => {
      const code = result.getText();
      if (!code || code === lastScannedRef.current) return;
      lastScannedRef.current = code;

      // Feedback
      setScanned(true);
      try { navigator.vibrate?.(200); } catch {}

      const { data, error } = await supabase
        .from("produtos_referencia")
        .select("*")
        .eq("referencia", code)
        .limit(1)
        .maybeSingle();

      if (error) {
        onError(new Error(getSafeErrorMessage(error)));
        onDone();
        return;
      }

      if (data) {
        onDone();
        onProductFound(data, code);
      } else {
        onDone();
        onNotFound();
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("MultiFormat") || msg.includes("NotFoundException")) return;
      onError(err instanceof Error ? err : new Error(msg));
    },
    constraints: {
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // @ts-ignore – focusMode is valid on Android but not in TS defs
        focusMode: { ideal: "continuous" },
      },
      audio: false,
    },
  });

  const [torchOn, setTorchOn] = useState(false);
  const toggleTorch = async () => {
    if (torchOn) {
      await torch.off();
    } else {
      await torch.on();
    }
    setTorchOn(!torchOn);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
      <video
        ref={ref}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />

      <ScanOverlay scanned={scanned} />

      {/* Torch button */}
      {torch.isAvailable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white h-9 w-9 pointer-events-auto"
          onClick={toggleTorch}
          aria-label={torchOn ? "Desligar lanterna" : "Ligar lanterna"}
        >
          {torchOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
        </Button>
      )}
    </div>
  );
};

export const BarcodeScannerSheet = ({
  open,
  onOpenChange,
  onProductFound,
  onNotFound,
  onError,
}: BarcodeScannerSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Escanear código de barras</SheetTitle>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center overflow-hidden mt-4">
          {open && (
            <ScannerView
              onProductFound={onProductFound}
              onNotFound={onNotFound}
              onError={onError}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
