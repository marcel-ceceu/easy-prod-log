import { useRef } from "react";
import { useZxing } from "react-zxing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/safe-error";
import type { Tables } from "@/integrations/supabase/types";

type ProdutoReferencia = Tables<"produtos_referencia">;

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (produto: ProdutoReferencia, codbarra: string) => void;
  onNotFound: () => void;
  onError: (err: Error) => void;
}

/**
 * Inner scanner – mounted/unmounted with the sheet so useZxing
 * re-initialises cleanly each time (per react-zxing author advice).
 */
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

  const { ref } = useZxing({
    timeBetweenDecodingAttempts: 500,
    onResult: async (result) => {
      const code = result.getText();
      if (!code || code === lastScannedRef.current) return;
      lastScannedRef.current = code;

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
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
  });

  return (
    <video
      ref={ref}
      className="w-full h-full object-cover"
      autoPlay
      playsInline
      muted
    />
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
        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-md bg-black mt-4">
          {open && (
            <ScannerView
              onProductFound={onProductFound}
              onNotFound={onNotFound}
              onError={onError}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Aponte a câmera para o código de barras
        </p>
      </SheetContent>
    </Sheet>
  );
};
