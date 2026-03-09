import { useState } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { Button } from "@/react-app/components/ui/button";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useDebtors } from "@/react-app/hooks/useDebtors";
import { Users, CheckCircle2, Loader2, Building2 } from "lucide-react";
import type { Transaction } from "@/shared/types";
import { supabase } from "@/react-app/supabase"; // ¡Importante!
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/react-app/components/ui/tabs";

function DebtorCard({
  transaction,
  exchangeRate,
  onMarkAsPaid,
  isProcessing,
}: {
  transaction: Transaction;
  exchangeRate: number;
  onMarkAsPaid: (id: string) => void; // Cambiado a string
  isProcessing: boolean;
}) {
  const date = new Date(transaction.created_at).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={`rounded-lg p-4 shadow-sm border-2 ${transaction.debt_type === 'Por Pagar' ? 'bg-destructive/5 border-destructive/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-full ${transaction.debt_type === 'Por Pagar' ? 'bg-destructive/20' : 'bg-blue-500/20'}`}>
          {transaction.debt_type === 'Por Pagar' ? (
            <Building2 className="w-5 h-5 text-destructive" />
          ) : (
            <Users className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {transaction.client_name || "Cliente sin nombre"}
          </p>
          <p className="text-sm text-muted-foreground">
            {transaction.description || "Sin descripción"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-3 mb-3">
        <CurrencyDisplay
          amountUsd={transaction.amount_usd}
          exchangeRate={exchangeRate}
          size="lg"
          className="text-foreground font-bold"
        />
      </div>

      <Button
        onClick={() => onMarkAsPaid(transaction.id)}
        disabled={isProcessing}
        variant={transaction.debt_type === 'Por Pagar' ? "destructive" : "default"}
        className={`w-full font-semibold ${transaction.debt_type !== 'Por Pagar' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Liquidar Deuda
          </>
        )}
      </Button>
    </div>
  );
}

export default function Deudores() {
  const { stats } = useDashboardStats();
  const { debtors, loading, refetch } = useDebtors();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const exchangeRate = stats?.exchangeRate || 0;
  const accountsReceivable = debtors.filter(d => d.debt_type !== 'Por Pagar');
  const accountsPayable = debtors.filter(d => d.debt_type === 'Por Pagar');

  const totalReceivable = accountsReceivable.reduce((sum, d) => sum + d.amount_usd, 0);
  const totalPayable = accountsPayable.reduce((sum, d) => sum + d.amount_usd, 0);

  const handleMarkAsPaid = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("transactions")
        // No cambiamos el debt_type, así se refleja correctamente en el historial si fue por pagar o por cobrar.
        .update({ status: "Pagado", exchange_rate: exchangeRate })
        .eq("id", id);

      if (error) throw error;

      await refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al procesar deuda");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Layout>
      <Header title="Deudores" subtitle="Gestión de Cuentas" />
      <main className="px-4 py-6">
        <Tabs defaultValue="cobrar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cobrar">Por Cobrar (Clientes)</TabsTrigger>
            <TabsTrigger value="pagar">Por Pagar (Proveedores)</TabsTrigger>
          </TabsList>

          {/* Por Cobrar Tab */}
          <TabsContent value="cobrar">
            <div className="bg-blue-500/10 rounded-xl p-4 shadow-sm border border-blue-500/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-1">Total a Nuestro Favor</p>
                  <CurrencyDisplay
                    amountUsd={totalReceivable}
                    exchangeRate={exchangeRate}
                    size="lg"
                    className="text-blue-700 font-bold"
                  />
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : accountsReceivable.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No hay cuentas por cobrar</div>
            ) : (
              <div className="space-y-3">
                {accountsReceivable.map((debtor) => (
                  <DebtorCard
                    key={debtor.id}
                    transaction={debtor}
                    exchangeRate={exchangeRate}
                    onMarkAsPaid={handleMarkAsPaid}
                    isProcessing={processingId === debtor.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Por Pagar Tab */}
          <TabsContent value="pagar">
            <div className="bg-destructive/10 rounded-xl p-4 shadow-sm border border-destructive/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">Total a Debemos</p>
                  <CurrencyDisplay
                    amountUsd={totalPayable}
                    exchangeRate={exchangeRate}
                    size="lg"
                    className="text-destructive font-bold"
                  />
                </div>
                <div className="p-3 rounded-full bg-destructive/20">
                  <Building2 className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-destructive" /></div>
            ) : accountsPayable.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No hay cuentas por pagar</div>
            ) : (
              <div className="space-y-3">
                {accountsPayable.map((debtor) => (
                  <DebtorCard
                    key={debtor.id}
                    transaction={debtor}
                    exchangeRate={exchangeRate}
                    onMarkAsPaid={handleMarkAsPaid}
                    isProcessing={processingId === debtor.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </Layout>
  );
}