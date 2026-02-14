import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (qty: number) => void;
  currentQty: number;
  productLabel: string;
}

export function EditQuantityDialog({
  open,
  onOpenChange,
  onConfirm,
  currentQty,
  productLabel,
}: EditQuantityDialogProps) {
  const [qty, setQty] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQty(String(currentQty));
      setValidationError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, currentQty]);

  const handleConfirm = () => {
    const num = parseInt(qty, 10);
    if (!qty || isNaN(num) || num <= 0) {
      setValidationError("Insira uma quantidade válida (número inteiro positivo)");
      return;
    }
    setValidationError(null);
    onConfirm(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Quantidade</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2 break-words">
          {productLabel}
        </p>
        <div className="space-y-2">
          <Label htmlFor="edit-qty">QTD</Label>
          <Input
            ref={inputRef}
            id="edit-qty"
            type="number"
            inputMode="numeric"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: 10"
            className="text-lg h-12"
          />
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
