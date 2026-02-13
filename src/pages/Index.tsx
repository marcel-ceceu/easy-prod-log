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

  // Fluxo de busca: produto selecionado → popup quantidade
  const handleProductSelect = (produto: ProdutoReferencia) => {
    setSelectedProduct(produto);
    setQtyOpen(true);
  };

  const handleQtyConfirm = async (qty: number) => {
    if (!selectedProduct) return;
    const produto = selectedProduct;

    // Fecha imediatamente (UI otimista)
    setQtyOpen(false);
    setSelectedProduct(null);
    toast({
      title: "Produto registrado!",
      description: `${produto.descrprod || produto.codprod} — QTD: ${qty}`,
      className: "bg-green-600 text-white border-green-700",
    });

    // Insert em background
    const { error: insertError } = await supabase.from("produtos_inseridos").insert({
      codprod: produto.codprod,
      qtd: qty,
      novo: "N",
    });

    if (insertError) {
      toast({
        title: "Erro ao registrar!",
        description: insertError.message,
        variant: "destructive",
      });
    }
  };

  // Fluxo novo produto: descrição → quantidade
  const handleNewProductDesc = (desc: string) => {
    setNewProdDesc(desc);
    setNewProdOpen(false);
    setNewQtyOpen(true);
  };

  const handleNewQtyConfirm = async (qty: number) => {
    const desc = newProdDesc;

    // Fecha imediatamente (UI otimista)
    setNewQtyOpen(false);
    setNewProdDesc("");
    toast({
      title: "Registrando novo produto...",
      description: desc,
      className: "bg-green-600 text-white border-green-700",
    });

    // Gerar código + insert em background
    const { data: codData, error: codError } = await supabase.rpc("next_codprod_novo");

    if (codError || !codData) {
      toast({ title: "Erro ao gerar código!", description: codError?.message || "desconhecido", variant: "destructive" });
      return;
    }

    const { error: insertError } = await supabase.from("produtos_inseridos").insert({
      codprod: codData,
      qtd: qty,
      novo: "S",
      descrprod: desc,
    });

    if (insertError) {
      toast({ title: "Erro ao registrar!", description: insertError.message, variant: "destructive" });
    }
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
        onOpenChange={setQtyOpen}
        onConfirm={handleQtyConfirm}
        productLabel={
          selectedProduct
            ? `${selectedProduct.refforn || ""} · ${selectedProduct.marca || ""} · ${selectedProduct.descrprod || ""}`
            : ""
        }
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
        onOpenChange={setNewQtyOpen}
        onConfirm={handleNewQtyConfirm}
        productLabel={`Novo: ${newProdDesc}`}
      />
    </div>
  );
};

export default Index;
