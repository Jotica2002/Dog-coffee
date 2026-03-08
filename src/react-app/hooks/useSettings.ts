import { useState, useEffect, useCallback } from "react";
import type { SystemSettings } from "@/shared/types";
import { supabase } from "../supabase"; // Asegúrate de que apunte a tu supabase.ts

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscamos la primera fila de configuración (donde guardamos la tasa)
      const { data, error: supabaseError } = await supabase
        .from("system_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .single(); // Le decimos a Supabase que solo queremos un objeto, no un arreglo

      if (supabaseError) throw new Error(supabaseError.message);

      setSettings(data as SystemSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la tasa del dólar de Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExchangeRate = async (rate: number) => {
    try {
      // Si por alguna razón no ha cargado la configuración, evitamos el error
      if (!settings?.id) throw new Error("No se ha cargado la configuración inicial");

      // Actualizamos la base de datos real
      const { error: supabaseError } = await supabase
        .from("system_settings")
        .update({ current_exchange_rate_ves: rate })
        .eq("id", settings.id); // Solo actualiza la fila que acabamos de leer

      if (supabaseError) throw new Error(supabaseError.message);

      // Refrescamos los datos en la pantalla
      await fetchSettings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la nueva tasa en Supabase");
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateExchangeRate, refetch: fetchSettings };
}