import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type { Transaction } from "@/shared/types";

export function useDebtors() {
  const [debtors, setDebtors] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDebtors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("status", "Deudor") // Solo traemos los que deben dinero
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDebtors(data || []);
    } catch (err) {
      console.error("Error cargando deudores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  return { debtors, loading, refetch: fetchDebtors };
}