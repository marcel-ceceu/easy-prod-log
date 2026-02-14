import { useState } from "react";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { useNavigate } from "react-router-dom";
import { RecentEntriesTable } from "@/components/RecentEntriesTable";
import { NewProductDialog } from "@/components/NewProductDialog";
import { QuantityDialog } from "@/components/QuantityDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Plus } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  // Fluxo novo produto (separado)
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newQtyOpen, setNewQtyOpen] = useState(false);

  const handleNewProductDesc = (desc: string) => {
    setNewProdDesc(desc);
    setNewProdOpen(false);
    setNewQtyOpen(true);
  };

  const handleNewQtyConfirm = async (qty: number) => {
    const desc = newProdDesc;

    setNewQtyOpen(false);
    setNewProdDesc("");
    toast({
      title: "Registrando novo produto...",
      description: desc,
      className: "bg-green-600 text-white border-green-700",
    });

    const { data: codData, error: codError } = await supabase.rpc(
      "next_codprod_novo"
    );

    if (codError || !codData) {
      toast({
        title: "Erro ao gerar código!",
        description: codError?.message || "desconhecido",
        variant: "destructive",
      });
      return;
    }

    const { error: insertError } = await supabase
      .from("produtos_inseridos")
      .insert({
        codprod: codData,
        qtd: qty,
        novo: "S",
        descrprod: desc,
      });

    if (insertError) {
      toast({
        title: "Erro ao registrar!",
        description: getSafeErrorMessage(insertError),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Novo produto registrado!",
        description: `${desc} — QTD: ${qty}`,
        className: "bg-green-600 text-white border-green-700",
      });
      // Reload to refresh table
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold text-foreground tracking-tight text-center">
          Controle de Produtos
        </h1>
      </header>

      <main className="flex-1 flex flex-col px-4 py-4 gap-4 max-w-2xl mx-auto w-full">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/contagem")}
            size="lg"
            className="flex-1 gap-2 text-base"
          >
            <ClipboardList className="h-5 w-5" />
            Iniciar Contagem
          </Button>

          <Button
            onClick={() => setNewProdOpen(true)}
            size="lg"
            variant="outline"
            className="gap-2 text-base"
          >
            <Plus className="h-5 w-5" />
            Novo Produto
          </Button>
        </div>

        {/* Recent entries */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Últimos lançamentos
          </h2>
          <RecentEntriesTable />
        </div>
      </main>

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
