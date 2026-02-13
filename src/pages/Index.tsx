import { useState } from "react";
import { ProductSearch } from "@/components/ProductSearch";
import { QuantityDialog } from "@/components/QuantityDialog";
import { NewProductDialog } from "@/components/NewProductDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Plus } from "lucide-react";

type ProdutoReferencia = Tables<"produtos_referencia">;

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProdutoReferencia | null>(null);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newQtyOpen, setNewQtyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fluxo de busca: produto selecionado → popup quantidade
  const handleProductSelect = (produto: ProdutoReferencia) => {
    setSelectedProduct(produto);
    setError(null);
    setQtyOpen(true);
  };

  const handleQtyConfirm = async (qty: number) => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("produtos_inseridos").insert({
      codprod: selectedProduct.codprod,
      qtd: qty,
      novo: "N",
    });

    setLoading(false);
    if (insertError) {
      setError("Erro ao registrar: " + insertError.message);
      return;
    }

    setQtyOpen(false);
    setSelectedProduct(null);
    toast({
      title: "Produto registrado!",
      description: `${selectedProduct.descrprod || selectedProduct.codprod} — QTD: ${qty}`,
      className: "bg-green-600 text-white border-green-700",
    });
  };

  // Fluxo novo produto: descrição → quantidade
  const handleNewProductDesc = (desc: string) => {
    setNewProdDesc(desc);
    setNewProdOpen(false);
    setError(null);
    setNewQtyOpen(true);
  };

  const handleNewQtyConfirm = async (qty: number) => {
    setLoading(true);
    setError(null);

    // Gerar CODPROD via função do banco
    const { data: codData, error: codError } = await supabase.rpc("next_codprod_novo");

    if (codError || !codData) {
      setLoading(false);
      setError("Erro ao gerar código: " + (codError?.message || "desconhecido"));
      return;
    }

    const { error: insertError } = await supabase.from("produtos_inseridos").insert({
      codprod: codData,
      qtd: qty,
      novo: "S",
      descrprod: newProdDesc,
    });

    setLoading(false);
    if (insertError) {
      setError("Erro ao registrar: " + insertError.message);
      return;
    }

    setNewQtyOpen(false);
    setNewProdDesc("");
    toast({
      title: "Novo produto registrado!",
      description: `${newProdDesc} — Código: ${codData} — QTD: ${qty}`,
      className: "bg-green-600 text-white border-green-700",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Controle de Produtos
        </h1>

        <ProductSearch onSelect={handleProductSelect} />

        <Button
          onClick={() => setNewProdOpen(true)}
          size="lg"
          className="gap-2 text-base"
        >
          <Plus className="h-5 w-5" />
          NOVO PRODUTO
        </Button>
      </main>

      {/* Popup quantidade — produto existente */}
      <QuantityDialog
        open={qtyOpen}
        onOpenChange={(open) => {
          setQtyOpen(open);
          if (!open) setError(null);
        }}
        onConfirm={handleQtyConfirm}
        productLabel={
          selectedProduct
            ? `${selectedProduct.refforn || ""} · ${selectedProduct.marca || ""} · ${selectedProduct.descrprod || ""}`
            : ""
        }
        loading={loading}
        error={error}
      />

      {/* Popup descrição — novo produto */}
      <NewProductDialog
        open={newProdOpen}
        onOpenChange={setNewProdOpen}
        onConfirm={handleNewProductDesc}
      />

      {/* Popup quantidade — novo produto */}
      <QuantityDialog
        open={newQtyOpen}
        onOpenChange={(open) => {
          setNewQtyOpen(open);
          if (!open) setError(null);
        }}
        onConfirm={handleNewQtyConfirm}
        productLabel={`Novo: ${newProdDesc}`}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default Index;
