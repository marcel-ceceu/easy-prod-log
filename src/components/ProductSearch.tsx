import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ProdutoReferencia = Tables<"produtos_referencia">;

interface ProductSearchProps {
  onSelect: (produto: ProdutoReferencia) => void;
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProdutoReferencia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from("produtos_referencia")
        .select("*")
        .or(
          `refforn.ilike.${searchTerm},codprod.ilike.${searchTerm},compldesc.ilike.${searchTerm},descrprod.ilike.${searchTerm},marca.ilike.${searchTerm}`
        )
        .limit(5);

      setLoading(false);
      if (!error && data) {
        setResults(data);
        setIsOpen(data.length > 0);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (produto: ProdutoReferencia) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(produto);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg mx-auto">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Buscar produto por código, nome, marca..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-base h-12"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          Buscando...
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {results.map((produto) => (
            <button
              key={produto.codprod}
              onClick={() => handleSelect(produto)}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 text-sm"
            >
              <span className="font-semibold text-foreground">{produto.refforn || "—"}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">{produto.marca || "—"}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-foreground">{produto.descrprod || "—"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
