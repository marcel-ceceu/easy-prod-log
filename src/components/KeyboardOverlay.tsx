import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Delete } from "lucide-react";

interface KeyboardOverlayProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const KEYS_ROW1 = ["Q","W","E","R","T","Y","U","I","O","P"];
const KEYS_ROW2 = ["A","S","D","F","G","H","J","K","L"];
const KEYS_ROW3 = ["Z","X","C","V","B","N","M"];
const NUM_ROW = ["1","2","3","4","5","6","7","8","9","0"];

export function KeyboardOverlay({ open, value, onChange, onConfirm, onClose }: KeyboardOverlayProps) {
  const backspaceInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleKey = useCallback((key: string) => {
    onChange(value + key);
  }, [value, onChange]);

  const handleBackspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const valueRef = useRef(value);
  valueRef.current = value;

  const startBackspaceHold = useCallback(() => {
    backspaceInterval.current = setInterval(() => {
      onChange(valueRef.current.slice(0, -1));
    }, 100);
  }, [onChange]);

  const stopBackspaceHold = useCallback(() => {
    if (backspaceInterval.current) {
      clearInterval(backspaceInterval.current);
      backspaceInterval.current = null;
    }
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Cleanup interval on unmount
  useEffect(() => () => stopBackspaceHold(), [stopBackspaceHold]);

  if (!open) return null;

  // Note: onChange for hold needs functional update, but we pass it via a wrapper
  // We'll handle hold backspace with a ref to current value
  const renderRow = (keys: string[]) => (
    <div className="flex justify-center gap-[3px]">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
          className="h-11 min-w-[32px] flex-1 max-w-[40px] rounded-md bg-secondary text-secondary-foreground font-medium text-base active:bg-accent select-none touch-manipulation"
        >
          {k}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      onPointerDown={(e) => {
        // Close when tapping the backdrop area (above keyboard)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/40" onPointerDown={onClose} />

      {/* Keyboard panel */}
      <div className="relative z-10 bg-background border-t border-border p-2 pb-4 space-y-2 select-none">
        {/* Preview line */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 min-h-[40px] rounded-md border border-input bg-muted px-3 py-2 text-base break-all">
            {value || <span className="text-muted-foreground">Descrição do produto</span>}
            <span className="animate-pulse">|</span>
          </div>
          <button type="button" onPointerDown={(e) => { e.preventDefault(); onClose(); }} className="p-2 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Number row */}
        {renderRow(NUM_ROW)}

        {/* Letter rows */}
        {renderRow(KEYS_ROW1)}
        {renderRow(KEYS_ROW2)}

        {/* Row 3 with backspace */}
        <div className="flex justify-center gap-[3px]">
          {KEYS_ROW3.map((k) => (
            <button
              key={k}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleKey(k); }}
              className="h-11 min-w-[32px] flex-1 max-w-[40px] rounded-md bg-secondary text-secondary-foreground font-medium text-base active:bg-accent select-none touch-manipulation"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); handleBackspace(); startBackspaceHold(); }}
            onPointerUp={stopBackspaceHold}
            onPointerLeave={stopBackspaceHold}
            className="h-11 px-3 rounded-md bg-destructive/15 text-destructive font-medium active:bg-destructive/30 select-none touch-manipulation"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom row: space, clear, confirm */}
        <div className="flex gap-[3px] px-1">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
            className="h-11 px-4 rounded-md bg-muted text-muted-foreground text-sm font-medium active:bg-accent select-none touch-manipulation"
          >
            Limpar
          </button>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); handleKey(" "); }}
            className="h-11 flex-1 rounded-md bg-secondary text-secondary-foreground text-sm font-medium active:bg-accent select-none touch-manipulation"
          >
            espaço
          </button>
          <Button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onConfirm(); }}
            className="h-11 px-6 select-none touch-manipulation"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
