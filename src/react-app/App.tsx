import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { supabase } from "@/react-app/supabase";
import Dashboard from "@/react-app/pages/Dashboard";
import Registro from "@/react-app/pages/Registro";
import Historial from "@/react-app/pages/Historial";
import Deudores from "@/react-app/pages/Deudores";
import Configuracion from "@/react-app/pages/Configuracion";
import Login from "@/react-app/pages/Login";
import { Loader2 } from "lucide-react";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/registro" element={session ? <Registro /> : <Navigate to="/login" />} />
        <Route path="/historial" element={session ? <Historial /> : <Navigate to="/login" />} />
        <Route path="/deudores" element={session ? <Deudores /> : <Navigate to="/login" />} />
        <Route path="/configuracion" element={session ? <Configuracion /> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}
