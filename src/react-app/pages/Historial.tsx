import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useTransactions } from "@/react-app/hooks/useTransactions";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Receipt } from "lucide-react";
import type { Transaction } from "@/shared/types";

function TransactionCard({
  transaction,
  exchangeRate,
}: {
  transaction: Transaction;
  exchangeRate: number;
}) {
  const isExpense = transaction.transaction_type === "Gasto";
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

  const date = new Date(transaction.date).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
            <CurrencyDisplay
              amountUsd={Math.abs(transaction.amount_usd)}
              exchangeRate={exchangeRate}
              size="sm"
              className={isExpense ? "text-destructive font-bold" : "text-foreground font-bold"}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              {transaction.transaction_type}
            </span>
            {transaction.status && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  transaction.status === "Pagado"
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
        </div>
      </div>
    </div>
  );
}

export default function Historial() {
  const { stats } = useDashboardStats();
  const { transactions, loading } = useTransactions();

  const exchangeRate = stats?.exchangeRate || 0;

  return (
    <Layout>
      <Header title="Historial" subtitle="Libro de transacciones" />
      <main className="px-4 py-6">
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
              No hay transacciones registradas aún
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Agrega tu primera transacción desde el Registro
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {transactions.length} transacción{transactions.length !== 1 ? "es" : ""}
              </p>
            </div>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                exchangeRate={exchangeRate}
              />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
