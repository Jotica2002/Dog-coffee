import { useState } from "react";
import Header from "@/react-app/components/Header";
import Layout from "@/react-app/components/Layout";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { useSettings } from "@/react-app/hooks/useSettings";
import { DollarSign, Loader2, Save, TrendingUp, LogOut, Lock, RotateCcw, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/react-app/supabase";
import { useNavigate } from "react-router";

export default function Configuracion() {
  const { settings, loading, updateExchangeRate } = useSettings();
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ── Deshacer último cierre ──────────────────────────────────
  const [undoing, setUndoing] = useState(false);

  const handleUndoLastClose = async () => {
    if (!window.confirm("⚠️ ¿Deshacer el último cierre?\n\nLas transacciones del cierre más reciente volverán al historial activo.")) return;

    setUndoing(true);
    try {
      // Buscar la fecha del cierre más reciente
      const { data: lastArchived, error: fetchError } = await supabase
        .from("transactions")
        .select("created_at")
        .eq("status", "Archivado")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !lastArchived) {
        alert("No hay cierres anteriores para deshacer.");
        return;
      }

      // Obtener la fecha (solo YYYY-MM-DD) del último cierre
      const lastCloseDate = lastArchived.created_at.split("T")[0];
      const dayStart = `${lastCloseDate}T00:00:00`;
      const dayEnd = `${lastCloseDate}T23:59:59`;

      // Restaurar todas las transacciones de ese día a 'Pagado'
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "Pagado" })
        .eq("status", "Archivado")
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      if (updateError) throw updateError;
      alert("Cierre deshecho exitosamente. Las transacciones volvieron al historial activo.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al deshacer el cierre.");
    } finally {
      setUndoing(false);
    }
  };

  // ── Borrar base de datos ─────────────────────────────────────
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [wipePassword, setWipePassword] = useState("");
  const [wipeError, setWipeError] = useState("");
  const [wiping, setWiping] = useState(false);

  const handleWipeDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wipePassword) { setWipeError("Ingresa tu contraseña."); return; }

    setWiping(true);
    setWipeError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No hay sesión activa.");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: wipePassword,
      });
      if (authError) { setWipeError("Contraseña incorrecta."); return; }

      // Borrar todas las transacciones del usuario
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .not("id", "is", null);

      if (deleteError) throw deleteError;

      setWipeModalOpen(false);
      alert("Base de datos eliminada correctamente. El sistema está listo para empezar de cero.");
    } catch (err) {
      setWipeError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setWiping(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSavingPassword(true);
    setPasswordMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage("Error: " + error.message);
    } else {
      setPasswordMessage("Contraseña actualizada exitosamente");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(""), 3000);
    }

    setSavingPassword(false);
  };

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
                className={`p-3 rounded-lg text-sm ${message.includes("Error")
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

        {/* Security Section (Change Password) */}
        <div className="mt-8 bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Seguridad de la Cuenta
              </h2>
              <p className="text-sm text-muted-foreground">
                Cambia tu contraseña de acceso
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={savingPassword}
              />
            </div>

            {passwordMessage && (
              <div
                className={`p-3 rounded-lg text-sm ${passwordMessage.includes("Error") || passwordMessage.includes("no coinciden") || passwordMessage.includes("caracteres")
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-100 text-green-700"
                  }`}
              >
                {passwordMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar Contraseña
                </>
              )}
            </Button>
          </form>
        </div>
        {/* Close Register and Logout Section */}
        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <div className="bg-destructive/10 rounded-xl p-6 border border-destructive/20 mb-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Cierre de Caja</h3>
            <p className="text-sm text-destructive/80 mb-4">
              Archiva todas las transacciones actuales marcadas como "Pagado" para empezar un nuevo ciclo. Las deudas pendientes se mantendrán.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="destructive"
                onClick={async () => {
                  if (window.confirm("¿Estás seguro de realizar el cierre de caja? Esto archivará las transacciones actuales.")) {
                    setSaving(true);
                    const { error } = await supabase.from("transactions").update({ status: "Archivado" }).eq("status", "Pagado");
                    if (error) alert("Error: " + error.message);
                    else alert("Cierre de caja exitoso");
                    setSaving(false);
                  }
                }}
                disabled={saving || undoing}
                className="flex-1 font-semibold"
              >
                Realizar Cierre de Caja
              </Button>
              <Button
                variant="outline"
                onClick={handleUndoLastClose}
                disabled={saving || undoing}
                className="sm:w-auto font-semibold border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                {undoing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Deshacer Último Cierre
              </Button>
            </div>
          </div>

          {/* Zona Peligrosa */}
          <div className="bg-destructive/5 rounded-xl p-6 border border-destructive/30 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">Zona Peligrosa</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Elimina <strong>todas</strong> las transacciones permanentemente. Tu cuenta, tasa de cambio y configuración se mantendrán intactas.
            </p>
            <Button
              variant="destructive"
              onClick={() => { setWipePassword(""); setWipeError(""); setWipeModalOpen(true); }}
              className="w-full font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Borrar Toda la Base de Datos
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full font-semibold border-destructive text-destructive hover:bg-destructive hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4 italic">
            Sesión persistente activada (Permanecerás logueado al cerrar el navegador)
          </p>
        </div>

        {/* Modal: Confirmar borrado total */}
        {wipeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-destructive/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <h3 className="text-lg font-bold text-destructive">Confirmar Borrado</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Para confirmar, ingresa tu contraseña de acceso. Esta acción es <strong>irreversible</strong>.
              </p>
              <form onSubmit={handleWipeDatabase} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wipe-password">Contraseña</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      id="wipe-password"
                      type="password"
                      placeholder="Tu contraseña de acceso"
                      value={wipePassword}
                      onChange={(e) => { setWipePassword(e.target.value); setWipeError(""); }}
                      className="pl-10"
                      disabled={wiping}
                      autoFocus
                    />
                  </div>
                  {wipeError && <p className="text-xs text-destructive font-semibold">{wipeError}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setWipeModalOpen(false)} disabled={wiping}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="destructive" className="flex-1 font-bold" disabled={wiping || !wipePassword}>
                    {wiping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Sí, Borrar Todo
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
