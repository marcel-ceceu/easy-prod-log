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

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (descrprod: string) => void;
}

export function NewProductDialog({ open, onOpenChange, onConfirm }: NewProductDialogProps) {
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDesc("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
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
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="descrprod">Descrição do produto</Label>
          <Input
            ref={inputRef}
            id="descrprod"
            type="text"
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Descrição do produto"
            className="text-base h-12"
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
