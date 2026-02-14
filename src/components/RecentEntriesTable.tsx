import { useState, useEffect, useCallback } from "react";
import { getSafeErrorMessage } from "@/lib/safe-error";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EditQuantityDialog } from "./EditQuantityDialog";
import type { Tables } from "@/integrations/supabase/types";

type ProdutoInserido = Tables<"produtos_inseridos">;
type ProdutoReferencia = Tables<"produtos_referencia">;

interface EntryWithRef extends ProdutoInserido {
  refforn?: string | null;
  refDescrprod?: string | null;
}

export function RecentEntriesTable() {
  const [entries, setEntries] = useState<EntryWithRef[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editEntry, setEditEntry] = useState<EntryWithRef | null>(null);

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<EntryWithRef | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);

    // Fetch last 15 inserted products
    const { data: inseridos, error } = await supabase
      .from("produtos_inseridos")
      .select("*")
      .order("dtinsert", { ascending: false })
      .limit(15);

    if (error) {
      toast({
        title: "Erro ao carregar registros",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!inseridos || inseridos.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    // Fetch reference data for existing products (novo = 'N')
    const codprods = inseridos
      .filter((i) => i.novo === "N")
      .map((i) => i.codprod);

    let refMap: Record<string, ProdutoReferencia> = {};

    if (codprods.length > 0) {
      const { data: refs } = await supabase
        .from("produtos_referencia")
        .select("*")
        .in("codprod", codprods);

      if (refs) {
        refMap = Object.fromEntries(refs.map((r) => [r.codprod, r]));
      }
    }

    const enriched: EntryWithRef[] = inseridos.map((entry) => {
      const ref = refMap[entry.codprod];
      return {
        ...entry,
        refforn: ref?.refforn ?? null,
        refDescrprod: ref?.descrprod ?? entry.descrprod,
      };
    });

    setEntries(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle edit confirm
  const handleEditConfirm = async (qty: number) => {
    if (!editEntry) return;
    const entryId = editEntry.id;

    setEditEntry(null);

    const { error } = await supabase
      .from("produtos_inseridos")
      .update({ qtd: qty })
      .eq("id", entryId);

    if (error) {
      toast({
        title: "Erro ao editar",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Quantidade atualizada!",
      className: "bg-green-600 text-white border-green-700",
    });

    fetchEntries();
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteEntry) return;
    const entryId = deleteEntry.id;

    setDeleteEntry(null);

    const { error } = await supabase
      .from("produtos_inseridos")
      .delete()
      .eq("id", entryId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Registro excluído!",
      className: "bg-green-600 text-white border-green-700",
    });

    fetchEntries();
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLabel = (entry: EntryWithRef) => {
    if (entry.novo === "S") {
      return entry.descrprod || entry.codprod;
    }
    return entry.refforn || entry.codprod;
  };

  const getDescription = (entry: EntryWithRef) => {
    if (entry.novo === "S") return "Novo";
    return entry.refDescrprod || "—";
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Carregando...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum lançamento registrado.
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">REFFORN</TableHead>
              <TableHead className="min-w-[120px]">Descrição</TableHead>
              <TableHead className="w-[60px] text-center">QTD</TableHead>
              <TableHead className="w-[90px]">Data</TableHead>
              <TableHead className="w-[80px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-semibold text-xs">
                  {getLabel(entry)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {getDescription(entry)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {entry.qtd}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(entry.dtinsert)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditEntry(entry)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <EditQuantityDialog
        open={!!editEntry}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
        onConfirm={handleEditConfirm}
        currentQty={editEntry?.qtd ?? 0}
        productLabel={editEntry ? getLabel(editEntry) : ""}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteEntry}
        onOpenChange={(open) => {
          if (!open) setDeleteEntry(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir o registro de{" "}
              <strong>{deleteEntry ? getLabel(deleteEntry) : ""}</strong> (QTD:{" "}
              {deleteEntry?.qtd})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
