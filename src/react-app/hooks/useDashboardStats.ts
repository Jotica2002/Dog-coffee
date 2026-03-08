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
        .select("*");

      if (supabaseError) throw new Error(supabaseError.message);

      const transactions = txData as Transaction[];

      // Variables con los nombres EXACTOS que pide el types.ts
      let cajaActual = 0; 
      let cuentasPorCobrar = 0; 
      let ventasHoy = 0; 

      const today = new Date().toISOString().split('T')[0];

      transactions.forEach((tx) => {
        const amount = Number(tx.amount_usd) || 0;
        
        // Extraemos solo la fecha de created_at para comparar
        const txDate = tx.created_at ? tx.created_at.split('T')[0] : '';
        const isToday = txDate === today;

        // Lógica de la caja
        if (tx.transaction_type === 'Venta' && tx.status === 'Pagado') {
          cajaActual += amount;
        } else if (tx.transaction_type === 'Inyección de Capital') {
          cajaActual += amount;
        } else if (tx.transaction_type === 'Gasto') {
          cajaActual -= amount;
        }

        // Lógica de Deudores
        if (tx.status === 'Deudor') {
          cuentasPorCobrar += amount;
        }

        // Lógica de Ventas del día
        if (tx.transaction_type === 'Venta' && isToday) {
          ventasHoy += amount;
        }
      });

      // 3. Enviamos el paquete completo a la pantalla
      setStats({
        cajaActual,
        cuentasPorCobrar,
        ventasHoy,
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
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}