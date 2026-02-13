import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DescrProdField } from "@/components/DescrProdField";

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (descrprod: string) => void;
}

export function NewProductDialog({ open, onOpenChange, onConfirm }: NewProductDialogProps) {
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDesc("");
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!desc.trim()) {
      setError("Insira a descrição do produto");
      return;
    }
    setError(null);
    onConfirm(desc.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="descrprod">DESCRPROD</Label>
          <DescrProdField
            value={desc}
            onChange={setDesc}
            error={error}
            placeholder="Descrição do produto"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            Próximo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
