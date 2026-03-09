export type TransactionType = "Venta" | "Gasto" | "Inyección de Capital";
export type TransactionStatus = "Pagado" | "Deudor" | "Personal" | "Archivado";
export type DebtType = "Por Cobrar" | "Por Pagar";

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
  exchange_rate: number;
  original_amount_bs: number | null;
  status: TransactionStatus | null;
  client_name: string | null;
  payment_method: string | null;
  debt_type: DebtType | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  cajaActual: number;
  cajaActualVes: number;
  dineroReal: number;
  dineroRealVes: number;
  cuentasPorCobrar: number;
  cuentasPorCobrarVes: number;
  cuentasPorPagar: number;
  cuentasPorPagarVes: number;
  ventasHoy: number;
  ventasHoyVes: number;
  exchangeRate: number;
}
