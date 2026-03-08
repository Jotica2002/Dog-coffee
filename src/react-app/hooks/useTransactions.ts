import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "@/shared/types";
import { supabase } from "../supabase"; // Asegúrate de que esta ruta apunte a tu nuevo archivo supabase.ts

export function useTransactions(limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usamos useCallback para poder llamar a esta función cuando queramos actualizar la lista
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // Iniciamos la consulta a nuestra tabla real en Supabase
      let query = supabase
        .from("transactions")
        .select("*")
        .neq("status", "Archivado")
        .order("created_at", { ascending: false }); // Las más nuevas primero

      // Si la app pide un límite (ej. "las 5 transacciones recientes" del dashboard), lo aplicamos
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw new Error(supabaseError.message);

      setTransactions(data as Transaction[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al conectar con Supabase");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Ahora el refetch actualiza los datos suavemente sin recargar la página entera
  return { transactions, loading, error, refetch: fetchTransactions };
}