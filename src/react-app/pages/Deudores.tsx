import { useState } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { Button } from "@/react-app/components/ui/button";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useDebtors } from "@/react-app/hooks/useDebtors";
import { Users, CheckCircle2, Loader2 } from "lucide-react";
import type { Transaction } from "@/shared/types";
import { supabase } from "@/react-app/supabase"; // ¡Importante!

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
    <div className="bg-accent/30 rounded-lg p-4 shadow-sm border-2 border-accent">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-full bg-accent">
          <Users className="w-5 h-5 text-accent-foreground" />
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
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
  const totalDebt = debtors.reduce((sum, d) => sum + d.amount_usd, 0);

  const handleMarkAsPaid = async (id: string) => {
    setProcessingId(id);
    try {
      // ¡Aquí está la magia de Supabase!
      const { error } = await supabase
        .from("transactions")
        .update({ status: "Pagado", exchange_rate: exchangeRate })
        .eq("id", id);

      if (error) throw error;

      await refetch();
      // Si activaste el tiempo real que hablamos antes, los stats se actualizan solos
      // Si no, puedes dejar este reload momentáneamente:
      // window.location.reload(); 
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al cobrar");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Layout>
      <Header title="Deudores" subtitle="Cuentas por cobrar" />
      <main className="px-4 py-6">
        <div className="bg-accent rounded-xl p-4 shadow-sm border border-accent mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-foreground/80 mb-1">Total por Cobrar</p>
              <CurrencyDisplay
                amountUsd={totalDebt}
                exchangeRate={exchangeRate}
                size="lg"
                className="text-accent-foreground font-bold"
              />
            </div>
            <div className="p-3 rounded-full bg-accent-foreground/10">
              <Users className="w-6 h-6 text-accent-foreground" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : debtors.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No hay cuentas por cobrar</div>
        ) : (
          <div className="space-y-3">
            {debtors.map((debtor) => (
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
      </main>
    </Layout>
  );
}