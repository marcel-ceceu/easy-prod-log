import { useState } from "react";
import { KeyboardOverlay } from "./KeyboardOverlay";

interface DescrProdFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
}

export function DescrProdField({ value, onChange, error, placeholder = "Descrição do produto" }: DescrProdFieldProps) {
  const [kbOpen, setKbOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openKeyboard = () => {
    setDraft(value);
    setKbOpen(true);
  };

  const handleConfirm = () => {
    onChange(draft);
    setKbOpen(false);
  };

  return (
    <>
      {/* Fake input — never triggers native keyboard */}
      <div
        role="button"
        tabIndex={0}
        onClick={openKeyboard}
        onKeyDown={(e) => { if (e.key === "Enter") openKeyboard(); }}
        className={`flex h-12 w-full items-center rounded-md border bg-background px-3 py-2 text-base cursor-pointer select-none ${
          error ? "border-destructive" : "border-input"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      >
        {value ? (
          <span className="text-foreground">{value}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      <input type="hidden" name="descrprod" value={value} />

      <KeyboardOverlay
        open={kbOpen}
        value={draft}
        onChange={setDraft}
        onConfirm={handleConfirm}
        onClose={() => setKbOpen(false)}
      />
    </>
  );
}
