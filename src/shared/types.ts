export type TransactionType = "Venta" | "Gasto" | "Inyección de Capital";
export type TransactionStatus = "Pagado" | "Deudor" | "Personal";

export interface SystemSettings {
  id: string;
  current_exchange_rate_ves: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  transaction_type: TransactionType;
  description: string | null;
  amount_usd: number;
  status: TransactionStatus | null;
  client_name: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  cajaActual: number;
  cuentasPorCobrar: number;
  ventasHoy: number;
  exchangeRate: number;
}
