import { Wallet, Users, TrendingUp, ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useTransactions } from "@/react-app/hooks/useTransactions";
import type { Transaction } from "@/shared/types";

function StatCard({
  title,
  icon: Icon,
  amountUsd,
  amountVesExact,
  exchangeRate,
  variant = "default",
}: {
  title: string;
  icon: React.ElementType;
  amountUsd: number;
  amountVesExact?: number;
  exchangeRate: number;
  variant?: "default" | "accent" | "muted" | "receivable" | "payable";
}) {
  const bgClasses = {
    default: "bg-card border-border",
    accent: "bg-accent/30 border-accent",
    muted: "bg-muted border-border",
    receivable: "bg-blue-500/10 border-blue-500/20",
    payable: "bg-destructive/10 border-destructive/20",
  };

  const iconClasses = {
    default: "text-primary bg-primary/10",
    accent: "text-accent-foreground bg-accent/50",
    muted: "text-muted-foreground bg-muted-foreground/10",
    receivable: "text-blue-600 bg-blue-500/20",
    payable: "text-destructive bg-destructive/20",
  };

  return (
    <div className={`${bgClasses[variant]} rounded-xl p-4 shadow-sm border`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg ${iconClasses[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <CurrencyDisplay
        amountUsd={amountUsd}
        amountVesExact={amountVesExact}
        exchangeRate={exchangeRate}
        size="lg"
      />
    </div>
  );
}

function RecentTransaction({
  transaction,
  exchangeRate,
}: {
  transaction: Transaction;
  exchangeRate: number;
}) {
  const isExpense = transaction.transaction_type === "Gasto";
  const isDeudor = transaction.status === "Deudor";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div
        className={`p-2 rounded-full ${isExpense
          ? "bg-destructive/10 text-destructive"
          : isDeudor
            ? "bg-accent/50 text-accent-foreground"
            : "bg-primary/10 text-primary"
          }`}
      >
        {isExpense ? (
          <ArrowDownCircle className="w-4 h-4" />
        ) : (
          <ArrowUpCircle className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {transaction.description || "Sin descripción"}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.transaction_type} {isDeudor && "• Pendiente"}
        </p>
      </div>
      <CurrencyDisplay
        amountUsd={Math.abs(transaction.amount_usd)}
        amountVesExact={Math.abs(transaction.original_amount_bs || 0) || undefined}
        exchangeRate={transaction.exchange_rate || exchangeRate}
        size="sm"
        className={isExpense ? "text-destructive" : "text-foreground"}
      />
    </div>
  );
}

export default function Dashboard() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { transactions, loading: transactionsLoading } = useTransactions(5);

  const today = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const exchangeRate = stats?.exchangeRate || 0;
  const isLoading = statsLoading || transactionsLoading;

  return (
    <Layout>
      <Header title="Dog Coffee" subtitle={today} />

      <main className="px-4 py-4 space-y-4">
        {/* Exchange Rate Banner */}
        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Tasa del día</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {isLoading ? "..." : `1 USD = ${exchangeRate.toFixed(2)} Bs`}
          </span>
        </div>

        {/* Balance Principal (Dinero Real) */}
        <div className={`rounded-xl p-6 shadow-md border-2 ${stats && stats.dineroReal >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-bold ${stats && stats.dineroReal >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                Dinero Real en Caja
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Efectivo 100% disponible</p>
            </div>
            <div className={`p-4 rounded-full ${stats && stats.dineroReal >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-destructive/20 text-destructive'}`}>
              <Wallet className="w-8 h-8" />
            </div>
          </div>
          <CurrencyDisplay
            amountUsd={stats?.dineroReal || 0}
            amountVesExact={stats?.dineroRealVes || 0}
            exchangeRate={exchangeRate}
            size="lg"
            className={`${stats && stats.dineroReal >= 0 ? 'text-green-700' : 'text-destructive'} text-3xl md:text-4xl`}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3">
          <StatCard
            title="Balance Total Histórico (Info)"
            icon={Wallet}
            amountUsd={stats?.cajaActual || 0}
            amountVesExact={stats?.cajaActualVes || 0}
            exchangeRate={exchangeRate}
            variant="default"
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Total por Cobrar"
              icon={Users}
              amountUsd={stats?.cuentasPorCobrar || 0}
              amountVesExact={stats?.cuentasPorCobrarVes || 0}
              exchangeRate={exchangeRate}
              variant="receivable"
            />
            <StatCard
              title="Total por Pagar"
              icon={Users}
              amountUsd={stats?.cuentasPorPagar || 0}
              amountVesExact={stats?.cuentasPorPagarVes || 0}
              exchangeRate={exchangeRate}
              variant="payable"
            />
          </div>
          <StatCard
            title="Ventas de Hoy"
            icon={TrendingUp}
            amountUsd={stats?.ventasHoy || 0}
            amountVesExact={stats?.ventasHoyVes || 0}
            exchangeRate={exchangeRate}
            variant="muted"
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Transacciones Recientes
          </h2>
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Cargando...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay transacciones aún
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <RecentTransaction
                  key={tx.id}
                  transaction={tx}
                  exchangeRate={exchangeRate}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
