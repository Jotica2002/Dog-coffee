import { useState, useEffect, useCallback } from "react";
import type { DashboardStats, Transaction } from "@/shared/types";
import { supabase } from "../supabase";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Buscamos la tasa de cambio actual para mostrarla arriba a la derecha
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("current_exchange_rate_ves")
        .limit(1)
        .single();

      const exchangeRate = settingsData?.current_exchange_rate_ves || 0;

      // 2. Traemos todas las transacciones para calcular el balance de la caja
      const { data: txData, error: supabaseError } = await supabase
        .from("transactions")
        .select("*")
        .neq("status", "Archivado");

      if (supabaseError) throw new Error(supabaseError.message);

      const transactions = txData as Transaction[];

      // Variables con los nombres EXACTOS que pide el types.ts
      let cajaActual = 0;
      let cajaActualVes = 0;
      let dineroReal = 0;
      let dineroRealVes = 0;
      let cuentasPorCobrar = 0;
      let cuentasPorCobrarVes = 0;
      let cuentasPorPagar = 0;
      let cuentasPorPagarVes = 0;
      let ventasHoy = 0;
      let ventasHoyVes = 0;

      const today = new Date().toISOString().split('T')[0];

      transactions.forEach((tx) => {
        const amount = Number(tx.amount_usd) || 0;
        const txRate = tx.exchange_rate || exchangeRate;
        const amountVes = tx.original_amount_bs !== null && tx.original_amount_bs !== undefined
          ? Number(tx.original_amount_bs)
          : (amount * txRate);

        // Extraemos solo la fecha de created_at para comparar
        const txDate = tx.created_at ? tx.created_at.split('T')[0] : '';
        const isToday = txDate === today;

        // Lógica de la caja (Legacy para no romper otras métricas si las hay)
        if (tx.transaction_type === 'Venta' && tx.status === 'Pagado') {
          cajaActualVes += amountVes;
        } else if (tx.transaction_type === 'Inyección de Capital') {
          cajaActualVes += amountVes;
        } else if (tx.transaction_type === 'Gasto') {
          cajaActualVes -= amountVes;
        }

        // Lógica de Dinero Real en Caja (Estricto 'Pagado')
        if (tx.status === 'Pagado') {
          if (tx.transaction_type === 'Venta' || tx.transaction_type === 'Inyección de Capital') {
            dineroRealVes += amountVes;
          } else if (tx.transaction_type === 'Gasto') {
            dineroRealVes -= amountVes;
          }
        }

        // Lógica de Deudores
        if (tx.status === 'Deudor') {
          if (tx.debt_type === 'Por Pagar') {
            cuentasPorPagarVes += amountVes;
          } else {
            // Por defecto, o si es 'Por Cobrar', sumamos a cuentas por cobrar
            cuentasPorCobrarVes += amountVes;
          }
        }

        // Lógica de Ventas del día
        if (tx.transaction_type === 'Venta' && isToday) {
          ventasHoyVes += amountVes;
        }
      });

      if (exchangeRate > 0) {
        cajaActual = cajaActualVes / exchangeRate;
        dineroReal = dineroRealVes / exchangeRate;
        cuentasPorCobrar = cuentasPorCobrarVes / exchangeRate;
        cuentasPorPagar = cuentasPorPagarVes / exchangeRate;
        ventasHoy = ventasHoyVes / exchangeRate;
      } else {
        cajaActual = 0;
        dineroReal = 0;
        cuentasPorCobrar = 0;
        cuentasPorPagar = 0;
        ventasHoy = 0;
      }

      // 3. Enviamos el paquete completo a la pantalla
      setStats({
        cajaActual,
        cajaActualVes,
        dineroReal,
        dineroRealVes,
        cuentasPorCobrar,
        cuentasPorCobrarVes,
        cuentasPorPagar,
        cuentasPorPagarVes,
        ventasHoy,
        ventasHoyVes,
        exchangeRate
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al calcular las estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('dashboard-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}