import { useState } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { useSettings } from "@/react-app/hooks/useSettings";
import { DollarSign, Loader2, Save, TrendingUp } from "lucide-react";

export default function Configuracion() {
  const { settings, loading, updateExchangeRate } = useSettings();
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentRate = settings?.current_exchange_rate_ves || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) {
      setMessage("Por favor ingresa una tasa válida");
      return;
    }

    setSaving(true);
    setMessage("");

    const success = await updateExchangeRate(numRate);
    
    if (success) {
      setMessage("Tasa de cambio actualizada correctamente");
      setRate("");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Error al actualizar la tasa de cambio");
    }

    setSaving(false);
  };

  return (
    <Layout>
      <Header title="Configuración" subtitle="Ajustes del sistema" />
      <main className="px-4 py-6">
        {/* Current Rate Display */}
        <div className="bg-primary rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80 mb-1">
                Tasa de Cambio Actual
              </p>
              <p className="text-3xl font-bold text-primary-foreground">
                {currentRate.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} Bs.S
              </p>
              <p className="text-xs text-primary-foreground/70 mt-1">
                por cada 1 USD
              </p>
            </div>
            <div className="p-4 rounded-full bg-primary-foreground/10">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Update Rate Form */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Actualizar Tasa de Cambio
              </h2>
              <p className="text-sm text-muted-foreground">
                Ingresa la nueva tasa USD → VES
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchange-rate" className="text-sm font-medium">
                Nueva Tasa (Bs.S por USD)
              </Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 36.50"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={saving || loading}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Esta tasa se aplicará a todas las conversiones USD → VES
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("Error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={saving || loading || !rate}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar Tasa
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Nota:</span> Los
            cambios se aplicarán inmediatamente a todas las vistas del sistema.
            Todas las transacciones se guardan en USD y se convierten a VES
            usando esta tasa.
          </p>
        </div>
      </main>
    </Layout>
  );
}
