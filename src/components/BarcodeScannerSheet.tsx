import { useRef, useCallback } from "react";
import { useZxing } from "react-zxing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ProdutoReferencia = Tables<"produtos_referencia">;

const DEBOUNCE_MS = 2000;

type BarcodeScannerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (produto: ProdutoReferencia, codbarra: string) => void;
  onNotFound: () => void;
  onError?: (error: Error) => void;
};

export const BarcodeScannerSheet = ({
  open,
  onOpenChange,
  onProductFound,
  onNotFound,
  onError,
}: BarcodeScannerSheetProps) => {
  const lastCodeRef = useRef<{ code: string; time: number } | null>(null);

  const handleDecodeResult = useCallback(
    async (result: { getText: () => string }) => {
      const code = result.getText()?.trim();
      if (!code) return;

      const now = Date.now();
      const last = lastCodeRef.current;
      if (last && last.code === code && now - last.time < DEBOUNCE_MS) {
        return;
      }
      lastCodeRef.current = { code, time: now };

      const { data, error } = await supabase
        .from("produtos_referencia")
        .select("*")
        .or(`referencia.eq.${code},refforn.eq.${code},codprod.eq.${code}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        onError?.(new Error(error.message));
        return;
      }

      if (data) {
        onProductFound(data, code);
        onOpenChange(false);
      } else {
        onNotFound();
      }
    },
    [onProductFound, onNotFound, onOpenChange, onError]
  );

  const { ref } = useZxing({
    onResult: handleDecodeResult,
    onError: (err) => {
      if (err.name === "NotAllowedError") {
        onError?.(new Error("Permissão de câmera negada. Habilite no navegador."));
      } else {
        onError?.(err);
      }
    },
    paused: !open,
    constraints: {
      video: { facingMode: "environment" },
      audio: false,
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] flex flex-col gap-4"
      >
        <SheetHeader>
          <SheetTitle>Escanear código de barras</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black">
          <video
            ref={ref}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
