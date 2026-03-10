import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import type { Transaction } from "@/shared/types";

export interface ArchivedSummary {
    date: string;
    totalUsd: number;
    totalVesExact: number;
    count: number;
    transactions: Transaction[];
}

export function useArchivedTransactions() {
    const [archived, setArchived] = useState<ArchivedSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchArchived = useCallback(async () => {
        try {
            setLoading(true);

            const { data: settingsData } = await supabase
                .from("system_settings")
                .select("current_exchange_rate_ves")
                .limit(1)
                .single();

            const globalRate = settingsData?.current_exchange_rate_ves || 0;

            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("status", "Archivado")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const transactions = (data || []) as Transaction[];

            // Agrupar por fecha
            const grouped = transactions.reduce((acc, tx) => {
                const dateStr = tx.created_at ? tx.created_at.split('T')[0] : 'Desconocida';
                if (!acc[dateStr]) {
                    acc[dateStr] = {
                        date: dateStr,
                        totalUsd: 0,
                        totalVesExact: 0,
                        count: 0,
                        transactions: []
                    };
                }

                const amount = Number(tx.amount_usd) || 0;
                const txRate = tx.exchange_rate || globalRate;
                const amountVes = amount * txRate;

                // Ventas e Inyecciones suman, Gastos restan
                if (tx.transaction_type === 'Gasto') {
                    acc[dateStr].totalUsd -= amount;
                    acc[dateStr].totalVesExact -= amountVes;
                } else if (tx.transaction_type === 'Venta' || tx.transaction_type === 'Inyección de Capital') {
                    acc[dateStr].totalUsd += amount;
                    acc[dateStr].totalVesExact += amountVes;
                }

                acc[dateStr].count += 1;
                acc[dateStr].transactions.push(tx);

                return acc;
            }, {} as Record<string, ArchivedSummary>);

            // Convertir a array y ordenar por fecha descendente
            const summaryArray = Object.values(grouped).sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setArchived(summaryArray);
        } catch (err) {
            console.error("Error cargando cierres:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArchived();

        const channel = supabase
            .channel('archived-list-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => {
                    fetchArchived();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchArchived]);

    return { archived, loading, refetch: fetchArchived };
}
