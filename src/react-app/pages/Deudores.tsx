import { useState, useEffect } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import CurrencyDisplay from "@/react-app/components/CurrencyDisplay";
import { Button } from "@/react-app/components/ui/button";
import { useDashboardStats } from "@/react-app/hooks/useDashboardStats";
import { useDebtors } from "@/react-app/hooks/useDebtors";
import { Users, CheckCircle2, Loader2, Building2 } from "lucide-react";
import type { Transaction } from "@/shared/types";
import { supabase } from "@/react-app/supabase"; // ¡Importante!
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/react-app/components/ui/dialog";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/react-app/components/ui/tabs";

function DebtorCard({
  transaction,
  exchangeRate,
  onMarkAsPaid,
  onAbonar,
  isProcessing,
}: {
  transaction: Transaction;
  exchangeRate: number;
  onMarkAsPaid: (id: string, debtType: string | null) => void;
  onAbonar?: (transaction: Transaction) => void;
  isProcessing: boolean;
}) {
  const date = new Date(transaction.created_at).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={`rounded-lg p-4 shadow-sm border-2 ${transaction.debt_type === 'Por Pagar' ? 'bg-destructive/5 border-destructive/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-full ${transaction.debt_type === 'Por Pagar' ? 'bg-destructive/20' : 'bg-blue-500/20'}`}>
          {transaction.debt_type === 'Por Pagar' ? (
            <Building2 className="w-5 h-5 text-destructive" />
          ) : (
            <Users className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {transaction.client_name || "Cliente sin nombre"}
          </p>
          <p className="text-sm text-muted-foreground">
            {transaction.description || "Sin descripción"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-3 mb-3">
        <CurrencyDisplay
          amountUsd={transaction.amount_usd}
          exchangeRate={exchangeRate}
          size="lg"
          className="text-foreground font-bold"
        />
      </div>

      <div className={`grid ${transaction.debt_type === 'Por Pagar' && onAbonar ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
        {transaction.debt_type === 'Por Pagar' && onAbonar && (
          <Button
            onClick={() => onAbonar(transaction)}
            disabled={isProcessing}
            variant="outline"
            className="w-full font-semibold border-destructive text-destructive hover:bg-destructive/10"
          >
            Abonar
          </Button>
        )}
        <Button
          onClick={() => onMarkAsPaid(transaction.id, transaction.debt_type)}
          disabled={isProcessing}
          variant={transaction.debt_type === 'Por Pagar' ? "destructive" : "default"}
          className={`w-full font-semibold ${transaction.debt_type !== 'Por Pagar' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Liquidar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function Deudores() {
  const { stats } = useDashboardStats();
  const { debtors, loading, refetch } = useDebtors();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // States for Abono Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [abonoModalOpen, setAbonoModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Transaction | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [abonoCurrency, setAbonoCurrency] = useState<"USD" | "VES">("USD");
  const [abonoAmountUsd, setAbonoAmountUsd] = useState("");
  const [abonoAmountVes, setAbonoAmountVes] = useState("");
  const [isProcessingAbono, setIsProcessingAbono] = useState(false);

  const exchangeRate = stats?.exchangeRate || 0;

  // Sync Abono Currencies
  useEffect(() => {
    if (!exchangeRate || !abonoModalOpen) return;

    if (abonoCurrency === "USD" && abonoAmountUsd) {
      const usd = parseFloat(abonoAmountUsd);
      if (!isNaN(usd)) {
        setAbonoAmountVes((usd * exchangeRate).toFixed(2));
      }
    } else if (abonoCurrency === "VES" && abonoAmountVes) {
      const ves = parseFloat(abonoAmountVes);
      if (!isNaN(ves)) {
        setAbonoAmountUsd((ves / exchangeRate).toFixed(2));
      }
    }
  }, [abonoAmountUsd, abonoAmountVes, abonoCurrency, exchangeRate, abonoModalOpen]);
  const accountsReceivable = debtors.filter(d => d.debt_type !== 'Por Pagar');
  const accountsPayable = debtors.filter(d => d.debt_type === 'Por Pagar');

  const totalReceivable = accountsReceivable.reduce((sum, d) => sum + d.amount_usd, 0);
  const totalPayable = accountsPayable.reduce((sum, d) => sum + d.amount_usd, 0);

  const handleMarkAsPaid = async (id: string, debtType: string | null) => {
    const isPayable = debtType === 'Por Pagar';
    const message = isPayable
      ? "¿Estás seguro de liquidar esta deuda? Esta acción RESTARÁ el dinero de tu caja real (Dinero Real en Caja)."
      : "¿Estás seguro de liquidar esta deuda? Esta acción SUMARÁ el dinero a tu caja real (Dinero Real en Caja). Asegúrate de tener el pago en mano.";

    if (!window.confirm(message)) {
      return;
    }

    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "Pagado", exchange_rate: exchangeRate })
        .eq("id", id);

      if (error) throw error;

      await refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al procesar deuda");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAbonarClick = (debtor: Transaction) => {
    setSelectedDebtor(debtor);
    setPassword("");
    setAbonoAmountUsd("");
    setAbonoAmountVes("");
    setAbonoCurrency("USD");
    setAuthModalOpen(true);
  };

  const confirmAuthForAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    setIsAuthenticating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No hay usuario autenticado");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) throw new Error("Contraseña incorrecta");

      setAuthModalOpen(false);
      setAbonoModalOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de validación (contraseña incorrecta)");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const processAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    const usdAmount = parseFloat(abonoAmountUsd);
    const vesAmount = parseFloat(abonoAmountVes);

    if (isNaN(usdAmount) || usdAmount <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    if (usdAmount >= selectedDebtor.amount_usd) {
      alert("El abono no puede ser igual o mayor a la deuda total. Para eso, usa el botón 'Liquidar'.");
      return;
    }

    setIsProcessingAbono(true);
    try {
      // 1. Disminuir la deuda original
      const remainingUsd = selectedDebtor.amount_usd - usdAmount;
      const remainingBs = (selectedDebtor.original_amount_bs || (selectedDebtor.amount_usd * exchangeRate)) - vesAmount;

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          amount_usd: remainingUsd,
          original_amount_bs: remainingBs,
        })
        .eq("id", selectedDebtor.id);

      if (updateError) throw updateError;

      // 2. Crear nueva transacción de gasto
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([{
          created_at: new Date().toISOString(),
          transaction_type: 'Gasto',
          description: `Abono a: ${selectedDebtor.client_name || 'Proveedor'}`,
          amount_usd: usdAmount,
          exchange_rate: exchangeRate,
          original_amount_bs: vesAmount,
          status: 'Pagado',
          debt_type: null,
          client_name: selectedDebtor.client_name,
          payment_method: null,
        }]);

      if (insertError) throw insertError;

      alert(`Abono realizado exitosamente. Deuda restante: $${remainingUsd.toFixed(2)}`);
      setAbonoModalOpen(false);
      await refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al procesar el abono");
    } finally {
      setIsProcessingAbono(false);
    }
  };

  return (
    <Layout>
      <Header title="Deudores" subtitle="Gestión de Cuentas" />
      <main className="px-4 py-6">
        <Tabs defaultValue="cobrar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cobrar">Por Cobrar (Clientes)</TabsTrigger>
            <TabsTrigger value="pagar">Por Pagar (Proveedores)</TabsTrigger>
          </TabsList>

          {/* Por Cobrar Tab */}
          <TabsContent value="cobrar">
            <div className="bg-blue-500/10 rounded-xl p-4 shadow-sm border border-blue-500/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-1">Total a Nuestro Favor</p>
                  <CurrencyDisplay
                    amountUsd={totalReceivable}
                    exchangeRate={exchangeRate}
                    size="lg"
                    className="text-blue-700 font-bold"
                  />
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : accountsReceivable.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No hay cuentas por cobrar</div>
            ) : (
              <div className="space-y-3">
                {accountsReceivable.map((debtor) => (
                  <DebtorCard
                    key={debtor.id}
                    transaction={debtor}
                    exchangeRate={exchangeRate}
                    onMarkAsPaid={handleMarkAsPaid}
                    isProcessing={processingId === debtor.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Por Pagar Tab */}
          <TabsContent value="pagar">
            <div className="bg-destructive/10 rounded-xl p-4 shadow-sm border border-destructive/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">Total a Debemos</p>
                  <CurrencyDisplay
                    amountUsd={totalPayable}
                    exchangeRate={exchangeRate}
                    size="lg"
                    className="text-destructive font-bold"
                  />
                </div>
                <div className="p-3 rounded-full bg-destructive/20">
                  <Building2 className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-destructive" /></div>
            ) : accountsPayable.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No hay cuentas por pagar</div>
            ) : (
              <div className="space-y-3">
                {accountsPayable.map((debtor) => (
                  <DebtorCard
                    key={debtor.id}
                    transaction={debtor}
                    exchangeRate={exchangeRate}
                    onMarkAsPaid={handleMarkAsPaid}
                    onAbonar={handleAbonarClick}
                    isProcessing={processingId === debtor.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Auth Modal para Abono */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Acción</DialogTitle>
            <DialogDescription>
              Ingrese la contraseña del sistema para procesar el abono a {selectedDebtor?.client_name || 'este proveedor'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmAuthForAbono}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Contraseña de administrador"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAuthModalOpen(false)} disabled={isAuthenticating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isAuthenticating || !password}>
                {isAuthenticating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continuar a Monto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Abono Modal */}
      <Dialog open={abonoModalOpen} onOpenChange={setAbonoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Monto a Abonar</DialogTitle>
            <DialogDescription>
              Deuda total actual de {selectedDebtor?.client_name || 'este proveedor'}: <span className="font-bold text-foreground">${selectedDebtor?.amount_usd.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={processAbono}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Moneda de Abono</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={abonoCurrency === "USD" ? "default" : "outline"}
                    onClick={() => setAbonoCurrency("USD")}
                    size="sm"
                  >
                    USD ($)
                  </Button>
                  <Button
                    type="button"
                    variant={abonoCurrency === "VES" ? "default" : "outline"}
                    onClick={() => setAbonoCurrency("VES")}
                    size="sm"
                  >
                    VES (Bs.S)
                  </Button>
                </div>
              </div>

              {abonoCurrency === "USD" ? (
                <div className="space-y-2">
                  <Label htmlFor="abono-usd">Monto (USD)</Label>
                  <Input
                    id="abono-usd"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedDebtor ? (selectedDebtor.amount_usd - 0.01).toFixed(2) : undefined}
                    value={abonoAmountUsd}
                    onChange={(e) => setAbonoAmountUsd(e.target.value)}
                    required
                  />
                  {abonoAmountVes && (
                    <div className="text-xs text-muted-foreground ml-1">≈ {parseFloat(abonoAmountVes).toLocaleString("es-VE")} Bs.S</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="abono-ves">Monto (Bs.S)</Label>
                  <Input
                    id="abono-ves"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={abonoAmountVes}
                    onChange={(e) => setAbonoAmountVes(e.target.value)}
                    required
                  />
                  {abonoAmountUsd && (
                    <div className="text-xs text-muted-foreground ml-1">≈ ${parseFloat(abonoAmountUsd).toLocaleString("en-US")} USD</div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center bg-muted/30 p-2 rounded">
                Tasa: 1 USD = {exchangeRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs.S
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAbonoModalOpen(false)} disabled={isProcessingAbono}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessingAbono}>
                {isProcessingAbono ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Procesar Abono
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}