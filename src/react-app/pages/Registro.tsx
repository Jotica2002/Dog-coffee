import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
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
import { CheckCircle2, Loader2, ArrowRightLeft } from "lucide-react";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import type { TransactionType, TransactionStatus, DebtType } from "@/shared/types";
import { supabase } from "@/react-app/supabase"; // ¡Aquí importamos nuestra conexión real!

export default function Registro() {
  const navigate = useNavigate();
  const { stats } = useDashboardStats();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");
  const [description, setDescription] = useState("");
  const [currencyInput, setCurrencyInput] = useState<"USD" | "VES">("USD");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountVes, setAmountVes] = useState("");
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [debtType, setDebtType] = useState<DebtType>("Por Cobrar");
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const exchangeRate = stats?.exchangeRate || 0;

  // Sync currency conversions
  useEffect(() => {
    if (!exchangeRate) return;

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
  }, [amountUsd, amountVes, currencyInput, exchangeRate]);

  const showClientNameField = status === "Deudor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Ajustamos la fecha: Si es hoy, guarda la hora exacta. Si es un día anterior, le pone las 12 del mediodía para evitar saltos de zona horaria.
      const today = new Date().toISOString().split("T")[0];
      const transactionDate = date === today
        ? new Date().toISOString()
        : new Date(date + "T12:00:00Z").toISOString();

      // ¡Aquí ocurre la magia! Escribimos directamente en Supabase
      const { error: supabaseError } = await supabase
        .from("transactions")
        .insert([{
          created_at: transactionDate,
          transaction_type: transactionType,
          description: description.trim() || "Venta de mostrador", // La DB requiere que no esté vacío
          amount_usd: parseFloat(amountUsd),
          exchange_rate: exchangeRate,
          original_amount_bs: parseFloat(amountVes),
          status: status,
          debt_type: showClientNameField ? debtType : null,
          client_name: showClientNameField ? clientName.trim() : null,
          payment_method: paymentMethod.trim() || null,
        }]);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido al guardar en Supabase");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <Header title="Nuevo Registro" subtitle="Agregar transacción" />
        <main className="px-4 py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              ¡Transacción registrada!
            </h2>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al inicio...
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Nuevo Registro" subtitle="Agregar transacción" />
      <main className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Tipo de Transacción <span className="text-destructive">*</span>
              </Label>
              <Select
                value={transactionType}
                onValueChange={(value) => {
                  setTransactionType(value as TransactionType);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venta">Venta</SelectItem>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                  <SelectItem value="Inyección de Capital">Inyección de Capital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status - Always visible and mandatory */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Estatus <span className="text-destructive">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as TransactionStatus);
                  if (value !== "Deudor") {
                    setClientName("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
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

            {/* Client/Supplier Name and Debt Type - Only for Deudor */}
            {showClientNameField && (
              <div className="space-y-4">
                <div className="space-y-2 border-l-4 border-primary pl-4 py-2 bg-muted/20 rounded-r-lg">
                  <Label className="text-sm font-bold text-primary">
                    Tipo de Deuda
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      type="button"
                      variant={debtType === "Por Cobrar" ? "default" : "outline"}
                      onClick={() => setDebtType("Por Cobrar")}
                      className={`w-full ${debtType === "Por Cobrar" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    >
                      Cliente debe (Cobrar)
                    </Button>
                    <Button
                      type="button"
                      variant={debtType === "Por Pagar" ? "default" : "outline"}
                      onClick={() => setDebtType("Por Pagar")}
                      className={`w-full ${debtType === "Por Pagar" ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : ""}`}
                    >
                      A Proveedor (Pagar)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm font-medium">
                    Nombre del {debtType === "Por Cobrar" ? "Cliente" : "Proveedor"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={debtType === "Por Cobrar" ? "Ej: Juan Pérez" : "Ej: Distribuidora Café"}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Café con leche x3, Pan dulce"
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Currency Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Moneda de Entrada <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={currencyInput === "USD" ? "default" : "outline"}
                  onClick={() => setCurrencyInput("USD")}
                  className="w-full"
                >
                  USD ($)
                </Button>
                <Button
                  type="button"
                  variant={currencyInput === "VES" ? "default" : "outline"}
                  onClick={() => setCurrencyInput("VES")}
                  className="w-full"
                >
                  VES (Bs.S)
                </Button>
              </div>
            </div>

            {/* Amount Input - Currency Dependent */}
            {currencyInput === "USD" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="amountUsd" className="text-sm font-medium">
                    Monto (USD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amountUsd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountUsd}
                    onChange={(e) => {
                      setAmountUsd(e.target.value);
                    }}
                    placeholder="0.00"
                    required
                    className="w-full text-lg"
                  />
                </div>
                {amountVes && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Equivalente: <span className="font-semibold text-foreground">{parseFloat(amountVes).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.S</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="amountVes" className="text-sm font-medium">
                    Monto (Bs.S) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amountVes"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountVes}
                    onChange={(e) => {
                      setAmountVes(e.target.value);
                    }}
                    placeholder="0.00"
                    required
                    className="w-full text-lg"
                  />
                </div>
                {amountUsd && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Equivalente: <span className="font-semibold text-foreground">${parseFloat(amountUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {exchangeRate > 0 && (
              <div className="text-xs text-muted-foreground text-center bg-muted/30 p-2 rounded">
                Tasa: 1 USD = {exchangeRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.S
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                Método de Pago
              </Label>
              <Input
                id="paymentMethod"
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ej: Efectivo, Pago móvil, Tarjeta"
                className="w-full"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Transacción"
            )}
          </Button>
        </form>
      </main>
    </Layout>
  );
}