import { useState, useMemo } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useTransactions } from "@/react-app/hooks/useTransactions";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Receipt, Archive, Pencil, Trash2, Loader2, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/react-app/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/react-app/components/ui/dialog";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { EditTransactionModal } from "@/react-app/components/EditTransactionModal";
import { supabase } from "@/react-app/supabase";
import { useArchivedTransactions, type ArchivedSummary } from "@/react-app/hooks/useArchivedTransactions";
import type { Transaction } from "@/shared/types";

function TransactionCard({
  transaction,
  exchangeRate,
  onEdit,
  onDelete,
  balanceUsd,
  balanceVesExact,
}: {
  transaction: Transaction;
  exchangeRate: number;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  balanceUsd?: number;
  balanceVesExact?: number;
}) {
  const isExpense = transaction.transaction_type === "Gasto" || (transaction.transaction_type as string) === "Abono a Proveedor";
  const isInjection = transaction.transaction_type === "Inyección de Capital";

  const Icon = isExpense
    ? ArrowDownCircle
    : isInjection
      ? Wallet
      : ArrowUpCircle;

  const iconColor = isExpense
    ? "text-destructive"
    : isInjection
      ? "text-blue-500"
      : "text-primary";

  const bgColor = isExpense
    ? "bg-destructive/10"
    : isInjection
      ? "bg-blue-50"
      : "bg-primary/10";

  const date = new Date(transaction.created_at).toLocaleString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {transaction.description || "Sin descripción"}
              </p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <CurrencyDisplay
                amountUsd={Math.abs(transaction.amount_usd)}
                amountVesExact={Math.abs(transaction.original_amount_bs || 0) || undefined}
                exchangeRate={transaction.exchange_rate || exchangeRate}
                size="sm"
                prefix={isExpense ? "- " : "+ "}
                className={isExpense ? "text-destructive font-bold text-base" : "text-green-600 font-bold text-base"}
              />
              {balanceUsd !== undefined && balanceVesExact !== undefined && (
                <div className="bg-muted/50 px-2 py-0.5 rounded-md border border-border flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Saldo</span>
                  <CurrencyDisplay
                    amountUsd={balanceUsd}
                    amountVesExact={balanceVesExact}
                    size="sm"
                    className="text-foreground font-medium"
                    showVes={true}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              {transaction.transaction_type}
            </span>
            {transaction.status && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${transaction.status === "Pagado"
                  ? "bg-green-100 text-green-700"
                  : transaction.status === "Deudor"
                    ? "bg-accent text-accent-foreground"
                    : "bg-blue-100 text-blue-700"
                  }`}
              >
                {transaction.status}
              </span>
            )}
            {transaction.client_name && (
              <span className="text-xs text-muted-foreground">
                Cliente: {transaction.client_name}
              </span>
            )}
            {transaction.payment_method && (
              <span className="text-xs text-muted-foreground">
                {transaction.payment_method}
              </span>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/50">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onEdit(transaction)}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(transaction)}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivedDayCard({ summary }: { summary: ArchivedSummary }) {
  const displayDate = new Date(summary.date + "T12:00:00Z").toLocaleDateString("es-VE", {
    weekday: 'long',
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="bg-muted/20 rounded-lg p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground capitalize">{displayDate}</p>
          <p className="text-xs text-muted-foreground">{summary.count} transacciones archivadas</p>
        </div>
        <div className="p-2 bg-muted rounded-full">
          <Archive className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div className="bg-background/80 rounded-md p-3 border border-border/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">Total Cierre:</span>
          <CurrencyDisplay
            amountUsd={summary.totalUsd}
            amountVesExact={summary.totalVesExact}
            size="md"
            className="font-bold text-foreground text-right"
          />
        </div>
      </div>
    </div>
  );
}

export default function Historial() {
  const { stats } = useDashboardStats();
  const { transactions, loading, refetch } = useTransactions();
  const { archived, loading: archivedLoading } = useArchivedTransactions();

  const exchangeRate = stats?.exchangeRate || 0;

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"edit" | "delete" | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"todo" | "efectivo">("todo");

  const displayedTransactions = activeFilter === "efectivo"
    ? transactions.filter(tx => tx.status === "Pagado" || tx.status === "Personal (Caja)")
    : transactions;

  // Calculamos los saldos progresivos en ambas pestañas
  const transactionsWithBalance = useMemo(() => {
    let currentBalanceVes = 0;
    // Invertimos temporalmente para procesar de más antigua a más reciente
    const reversed = [...displayedTransactions].reverse();
    
    const enriched = reversed.map(tx => {
      const txExchangeRate = tx.exchange_rate || exchangeRate;
      const isExpense = tx.transaction_type === "Gasto" || (tx.transaction_type as string) === "Abono a Proveedor";
      const amountVes = tx.original_amount_bs !== null && tx.original_amount_bs !== undefined
        ? Math.abs(tx.original_amount_bs)
        : Math.abs(tx.amount_usd) * txExchangeRate;
        
      if (isExpense) {
        currentBalanceVes -= amountVes;
      } else {
        currentBalanceVes += amountVes;
      }
      
      const balanceUsd = txExchangeRate > 0 ? currentBalanceVes / txExchangeRate : 0;
      
      return {
        ...tx,
        balanceVes: currentBalanceVes,
        balanceUsd: balanceUsd,
      };
    });
    
    // Volvemos a invertir para mostrar las más recientes primero
    return enriched.reverse();
  }, [displayedTransactions, activeFilter, exchangeRate]);

  // Totalizador dinámico
  const totalVes = displayedTransactions.reduce((acc, tx) => {
    const isExpense = tx.transaction_type === "Gasto" || (tx.transaction_type as string) === "Abono a Proveedor";
    const amount = tx.original_amount_bs !== null && tx.original_amount_bs !== undefined
      ? Math.abs(tx.original_amount_bs)
      : Math.abs(tx.amount_usd) * (tx.exchange_rate || exchangeRate);

    return isExpense ? acc - amount : acc + amount;
  }, 0);

  // Clave para evitar discrepancia de centavos: calculamos a partir de los VES igual que en el Dashboard
  const totalUsd = exchangeRate > 0 ? (totalVes / exchangeRate) : 0;

  const handleActionClick = (tx: Transaction, action: "edit" | "delete") => {
    setSelectedTx(tx);
    setActionType(action);
    setPassword("");
    setAuthModalOpen(true);
  };

  const confirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !actionType) return;

    setIsAuthenticating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No hay usuario autenticado");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) throw new Error("Contraseña incorrecta");

      if (actionType === "delete") {
        const { error: deleteError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", selectedTx.id);

        if (deleteError) throw deleteError;
        alert("Transacción eliminada con éxito");
        refetch();
        setAuthModalOpen(false);
      } else if (actionType === "edit") {
        setAuthModalOpen(false);
        setEditModalOpen(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de validación");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Layout>
      <Header title="Historial" subtitle="Libro de transacciones" />
      <main className="px-4 py-6">
        <Tabs defaultValue="activas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="cierres">Cierres Anteriores</TabsTrigger>
          </TabsList>

          <TabsContent value="activas">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex bg-muted p-1 rounded-lg self-start">
                <button
                  onClick={() => setActiveFilter("todo")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeFilter === "todo" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Todo el Historial
                </button>
                <button
                  onClick={() => setActiveFilter("efectivo")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeFilter === "efectivo" ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Solo Efectivo
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "efectivo"
                  ? `Mostrando ${displayedTransactions.length} movimientos que afectan tu saldo real`
                  : `${displayedTransactions.length} transacción${displayedTransactions.length !== 1 ? "es" : ""}`
                }
              </p>
            </div>

            {/* Totalizador */}
            {displayedTransactions.length > 0 && (
              <div className={`mb-4 rounded-xl p-4 shadow-sm border-2 ${totalUsd >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-sm font-bold ${totalUsd >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                      {activeFilter === "efectivo" ? "Efectivo Real" : "Balance Total"}
                    </h3>
                    <p className="text-xs text-muted-foreground">Suma de este Historial</p>
                  </div>
                  <CurrencyDisplay
                    amountUsd={Math.abs(totalUsd)}
                    amountVesExact={Math.abs(totalVes)}
                    exchangeRate={exchangeRate}
                    prefix={totalUsd < 0 ? "- " : "+ "}
                    size="lg"
                    className={`${totalUsd >= 0 ? 'text-green-700' : 'text-destructive'} text-right`}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col items-center justify-center min-h-[300px]">
                <Receipt className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground text-center">
                  Cargando transacciones...
                </p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col items-center justify-center min-h-[300px]">
                <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay transacciones activas registradas aún
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Agrega tu primera transacción desde el Registro
                </p>
              </div>
                ) : displayedTransactions.length === 0 ? (
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col items-center justify-center min-h-[200px]">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {activeFilter === "efectivo" ? "No hay transacciones en efectivo" : "No hay transacciones registradas"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactionsWithBalance.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    exchangeRate={exchangeRate}
                    onEdit={(tx) => handleActionClick(tx, "edit")}
                    onDelete={(tx) => handleActionClick(tx, "delete")}
                    balanceUsd={transaction.balanceUsd}
                    balanceVesExact={transaction.balanceVes}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cierres">
            {archivedLoading ? (
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col items-center justify-center min-h-[300px]">
                <Archive className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground text-center">
                  Cargando cierres...
                </p>
              </div>
            ) : archived.length === 0 ? (
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col items-center justify-center min-h-[300px]">
                <Archive className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay cierres anteriores registrados
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Los cierres aparecerán aquí cuando archives transacciones desde Configuración
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    {archived.length} cierre{archived.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {archived.map((summary) => (
                  <ArchivedDayCard
                    key={summary.date}
                    summary={summary}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Password Authorization Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Acción</DialogTitle>
            <DialogDescription>
              Ingrese la contraseña del sistema para {actionType === "edit" ? "editar" : "eliminar"} este registro.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmAction}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Contraseña de administrador"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAuthModalOpen(false)} disabled={isAuthenticating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isAuthenticating || !password} variant={actionType === "delete" ? "destructive" : "default"}>
                {isAuthenticating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {actionType === "delete" ? "Eliminar" : "Continuar a Edición"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={selectedTx}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          refetch();
        }}
      />
    </Layout>
  );
}
