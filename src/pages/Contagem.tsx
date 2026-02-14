import { useState, useEffect, useRef, useCallback } from "react";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, Check, ScanBarcode } from "lucide-react";
import { BarcodeScannerSheet } from "@/components/BarcodeScannerSheet";

type ProdutoReferencia = Tables<"produtos_referencia">;

type Phase = "search" | "quantity";

const Contagem = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("search");

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProdutoReferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected product state
  const [selectedProduct, setSelectedProduct] =
    useState<ProdutoReferencia | null>(null);
  const [scannedCodbarra, setScannedCodbarra] = useState<string | null>(null);

  // Scanner sheet state
  const [scannerOpen, setScannerOpen] = useState(false);

  // Quantity state
  const [qty, setQty] = useState("");
  const [qtyError, setQtyError] = useState<string | null>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount and when returning to search phase
  useEffect(() => {
    if (phase === "search") {
      // Small delay to ensure the DOM has updated
      const t = setTimeout(() => searchInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Focus qty input when entering quantity phase
  useEffect(() => {
    if (phase === "quantity") {
      const t = setTimeout(() => qtyInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from("produtos_referencia")
        .select("*")
        .ilike("refforn", searchTerm)
        .limit(5);

      setLoading(false);
      if (!error && data) {
        setResults(data);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handle product selection (manual search)
  const handleSelect = useCallback((produto: ProdutoReferencia) => {
    setSelectedProduct(produto);
    setScannedCodbarra(null);
    setQuery("");
    setResults([]);
    setQty("");
    setQtyError(null);
    setPhase("quantity");
  }, []);

  // Handle product found via barcode scanner
  const handleScannedProduct = useCallback(
    (produto: ProdutoReferencia, codbarra: string) => {
      setSelectedProduct(produto);
      setScannedCodbarra(codbarra);
      setQuery("");
      setResults([]);
      setQty("");
      setQtyError(null);
      setPhase("quantity");
    },
    []
  );

  // Handle quantity confirm
  const handleQtyConfirm = useCallback(async () => {
    if (!selectedProduct) return;

    const num = parseInt(qty, 10);
    if (!qty || isNaN(num) || num <= 0) {
      setQtyError("Insira uma quantidade válida");
      return;
    }

    const produto = selectedProduct;

    // Reset immediately (optimistic UI)
    setSelectedProduct(null);
    setScannedCodbarra(null);
    setQty("");
    setQtyError(null);
    setPhase("search");

    toast({
      title: "Produto registrado!",
      description: `${produto.refforn || produto.codprod} — QTD: ${num}`,
      className: "bg-green-600 text-white border-green-700",
    });

    // Insert in background
    const insertPayload = {
      codprod: produto.codprod,
      qtd: num,
      novo: "N" as const,
      ...(scannedCodbarra && { codbarra: scannedCodbarra }),
    };
    const { error: insertError } = await supabase
      .from("produtos_inseridos")
      .insert(insertPayload);

    if (insertError) {
      toast({
        title: "Erro ao registrar!",
        description: getSafeErrorMessage(insertError),
        variant: "destructive",
      });
    }
  }, [selectedProduct, qty, scannedCodbarra]);

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQtyConfirm();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Contagem
        </h1>
      </header>

      <main className="flex-1 flex flex-col px-4 py-4 max-w-lg mx-auto w-full">
        {phase === "search" && (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="search-refforn"
              className="text-sm font-medium text-muted-foreground"
            >
              Buscar por REFFORN
            </label>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                id="search-refforn"
                type="text"
                placeholder="Ex: DCH26"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-base h-12 flex-1"
                autoComplete="off"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setScannerOpen(true)}
                aria-label="Escanear código de barras"
              >
                <ScanBarcode className="h-6 w-6" />
              </Button>
            </div>

            {loading && (
              <p className="text-sm text-muted-foreground">Buscando...</p>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="rounded-md border bg-popover shadow-lg">
                {results.map((produto) => (
                  <button
                    key={produto.codprod}
                    onClick={() => handleSelect(produto)}
                    className="w-full text-left px-4 py-3 hover:bg-accent active:bg-accent transition-colors border-b last:border-b-0"
                  >
                    <span className="font-bold text-foreground text-base">
                      {produto.refforn || "—"}
                    </span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {produto.marca || "—"}
                    </span>
                    <div className="text-sm text-muted-foreground mt-0.5 truncate">
                      {produto.descrprod || "—"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </p>
            )}
          </div>
        )}

        {phase === "quantity" && selectedProduct && (
          <div className="flex flex-col gap-4">
            {/* Product info */}
            <div className="rounded-md border bg-muted/50 px-4 py-3">
              <p className="font-bold text-foreground text-lg">
                {selectedProduct.refforn || selectedProduct.codprod}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedProduct.marca || ""}{" "}
                {selectedProduct.descrprod ? `· ${selectedProduct.descrprod}` : ""}
              </p>
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <label
                htmlFor="qty-input"
                className="text-sm font-medium text-muted-foreground"
              >
                Quantidade
              </label>
              <div className="flex gap-2">
                <Input
                  ref={qtyInputRef}
                  id="qty-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Ex: 10"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    setQtyError(null);
                  }}
                  onKeyDown={handleQtyKeyDown}
                  className="text-lg h-12 flex-1"
                  autoFocus
                />
                <Button
                  onClick={handleQtyConfirm}
                  size="lg"
                  className="h-12 px-6"
                >
                  <Check className="h-5 w-5" />
                </Button>
              </div>
              {qtyError && (
                <p className="text-sm text-destructive">{qtyError}</p>
              )}
            </div>
          </div>
        )}
      </main>

      <BarcodeScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={handleScannedProduct}
        onNotFound={() => {
          toast({
            title: "Produto não encontrado",
            description:
              "O código de barras não está cadastrado. Cadastre em produtos_referencia.referencia.",
            variant: "destructive",
          });
        }}
        onError={(err) => {
          toast({
            title: "Erro na câmera",
            description: err.message,
            variant: "destructive",
          });
        }}
      />
    </div>
  );
};

export default Contagem;
