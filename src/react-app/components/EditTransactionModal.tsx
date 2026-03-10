import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/react-app/components/ui/dialog";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/react-app/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Transaction, TransactionType, TransactionStatus, DebtType } from "@/shared/types";
import { supabase } from "@/react-app/supabase";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";

interface EditTransactionModalProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTransactionModal({ transaction, isOpen, onClose, onSuccess }: EditTransactionModalProps) {
    const { stats } = useDashboardStats();
    const exchangeRate = stats?.exchangeRate || 0;

    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState("");
    const [transactionType, setTransactionType] = useState<TransactionType | "">("");
    const [description, setDescription] = useState("");
    const [currencyInput, setCurrencyInput] = useState<"USD" | "VES">("USD");
    const [amountUsd, setAmountUsd] = useState("");
    const [amountVes, setAmountVes] = useState("");
    const [status, setStatus] = useState<TransactionStatus | "">("");
    const [debtType, setDebtType] = useState<DebtType>("Por Cobrar");
    const [clientName, setClientName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");

    useEffect(() => {
        if (transaction && isOpen) {
            // Pre-fill the form
            setDate(transaction.created_at.split("T")[0]);
            setTransactionType(transaction.transaction_type);
            setDescription(transaction.description || "");
            setAmountUsd(Math.abs(transaction.amount_usd).toString());
            setAmountVes(Math.abs(transaction.original_amount_bs || 0).toString());
            setStatus(transaction.status || "");
            setDebtType(transaction.debt_type || "Por Cobrar");
            setClientName(transaction.client_name || "");
            setPaymentMethod(transaction.payment_method || "");
            setCurrencyInput("USD");
        }
    }, [transaction, isOpen]);

    // Sync currency conversions
    useEffect(() => {
        if (!exchangeRate || !isOpen) return;

        if (currencyInput === "USD" && amountUsd) {
            const usd = parseFloat(amountUsd);
            if (!isNaN(usd)) {
                setAmountVes((usd * exchangeRate).toFixed(2));
            }
        } else if (currencyInput === "VES" && amountVes) {
            const ves = parseFloat(amountVes);
            if (!isNaN(ves)) {
                setAmountUsd((ves / exchangeRate).toFixed(2));
            }
        }
    }, [amountUsd, amountVes, currencyInput, exchangeRate, isOpen]);

    const showClientNameField = status === "Deudor";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!transaction) return;
        if (!date || !transactionType || !amountUsd || !status) {
            alert("Por favor completa todos los campos requeridos");
            return;
        }

        if (showClientNameField && !clientName.trim()) {
            alert("Por favor ingresa el nombre para esta deuda");
            return;
        }

        setLoading(true);

        try {
            const targetDate = date === transaction.created_at.split("T")[0]
                ? transaction.created_at // Keep exact time if date hasn't changed
                : new Date(date + "T12:00:00Z").toISOString();

            let finalAmountUsd = parseFloat(amountUsd);
            let finalAmountVes = parseFloat(amountVes);

            // Expenses are stored as negative internally generally, though we handle UI mostly absolute. 
            // But looking at Registro.tsx, it just uses parseFloat directly: `amount_usd: parseFloat(amountUsd)`, 
            // which means the amount is always stored POSITIVELY if parseFloat returns positive, and transaction_type defines if it's expense.
            // Wait, let's look at `Dashboard.tsx`, it uses `Math.abs(transaction.amount_usd)` but we shouldn't insert negatives unless `Registro.tsx` does.
            // `Registro.tsx` inserts `amount_usd: parseFloat(amountUsd)`, so they are positive. We keep it positive.

            const { error: supabaseError } = await supabase
                .from("transactions")
                .update({
                    created_at: targetDate,
                    transaction_type: transactionType,
                    description: description.trim() || "Venta de mostrador",
                    amount_usd: finalAmountUsd,
                    exchange_rate: transaction.exchange_rate, // keep Original rate or update? Typically keep original for history
                    original_amount_bs: finalAmountVes,
                    status: status,
                    debt_type: showClientNameField ? debtType : null,
                    client_name: showClientNameField ? clientName.trim() : null,
                    payment_method: paymentMethod.trim() || null,
                })
                .eq("id", transaction.id);

            if (supabaseError) throw new Error(supabaseError.message);

            alert("Transacción actualizada exitosamente");
            onSuccess();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error al actualizar la transacción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Transacción</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form fields identical to Registro.tsx but compact */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-date">Fecha</Label>
                        <Input
                            id="edit-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-type">Tipo</Label>
                        <Select value={transactionType} onValueChange={(val: TransactionType) => setTransactionType(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Venta">Venta</SelectItem>
                                <SelectItem value="Gasto">Gasto</SelectItem>
                                <SelectItem value="Inyección de Capital">Inyección de Capital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-status">Estatus</Label>
                        <Select
                            value={status}
                            onValueChange={(val: TransactionStatus) => {
                                setStatus(val);
                                if (val !== "Deudor") setClientName("");
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona estatus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pagado">Pagado</SelectItem>
                                <SelectItem value="Deudor">Deudor</SelectItem>
                                <SelectItem value="Personal">Personal (No afecta caja)</SelectItem>
                                {transactionType === "Gasto" && (
                                    <SelectItem value="Personal (Caja)">Personal (Pagado con Caja real)</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {showClientNameField && (
                        <div className="space-y-3 border-l-2 border-primary pl-3">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={debtType === "Por Cobrar" ? "default" : "outline"}
                                    onClick={() => setDebtType("Por Cobrar")}
                                    className={debtType === "Por Cobrar" ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                    Cliente debe
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={debtType === "Por Pagar" ? "default" : "outline"}
                                    onClick={() => setDebtType("Por Pagar")}
                                    className={debtType === "Por Pagar" ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : ""}
                                >
                                    A Proveedor
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-client">Nombre</Label>
                                <Input
                                    id="edit-client"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Nombre de cliente/proveedor"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-desc">Descripción</Label>
                        <Textarea
                            id="edit-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Moneda Principal</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={currencyInput === "USD" ? "default" : "outline"}
                                onClick={() => setCurrencyInput("USD")}
                                size="sm"
                            >
                                USD ($)
                            </Button>
                            <Button
                                type="button"
                                variant={currencyInput === "VES" ? "default" : "outline"}
                                onClick={() => setCurrencyInput("VES")}
                                size="sm"
                            >
                                VES (Bs.S)
                            </Button>
                        </div>
                    </div>

                    {currencyInput === "USD" ? (
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount-usd">Monto (USD)</Label>
                            <Input
                                id="edit-amount-usd"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amountUsd}
                                onChange={(e) => setAmountUsd(e.target.value)}
                                required
                            />
                            {amountVes && (
                                <div className="text-xs text-muted-foreground ml-1">≈ {parseFloat(amountVes).toLocaleString("es-VE")} Bs.S</div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount-ves">Monto (Bs.S)</Label>
                            <Input
                                id="edit-amount-ves"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amountVes}
                                onChange={(e) => setAmountVes(e.target.value)}
                                required
                            />
                            {amountUsd && (
                                <div className="text-xs text-muted-foreground ml-1">≈ ${parseFloat(amountUsd).toLocaleString("en-US")} USD</div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-method">Método de Pago</Label>
                        <Input
                            id="edit-method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full mt-2">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar Cambios"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
