import { useEffect, useRef } from "react";
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

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (produto: ProdutoReferencia, codbarra: string) => void;
  onNotFound: () => void;
  onError: (err: Error) => void;
}

export const BarcodeScannerSheet = ({
  open,
  onOpenChange,
  onProductFound,
  onNotFound,
  onError,
}: BarcodeScannerSheetProps) => {
  const lastScannedRef = useRef<string | null>(null);

  const { ref } = useZxing({
    paused: !open,
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
        onError(new Error(error.message));
        onOpenChange(false);
        return;
      }

      if (data) {
        onOpenChange(false);
        onProductFound(data, code);
      } else {
        onOpenChange(false);
        onNotFound();
      }
    },
    onError: (err) => {
      onError(err instanceof Error ? err : new Error(String(err)));
    },
  });

  useEffect(() => {
    if (open) {
      lastScannedRef.current = null;
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Escanear código de barras</SheetTitle>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-md bg-black mt-4">
          {open && (
            <video
              ref={ref}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
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
