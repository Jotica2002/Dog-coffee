import { BrowserRouter as Router, Routes, Route } from "react-router";
import Dashboard from "@/react-app/pages/Dashboard";
import Registro from "@/react-app/pages/Registro";
import Historial from "@/react-app/pages/Historial";
import Deudores from "@/react-app/pages/Deudores";
import Configuracion from "@/react-app/pages/Configuracion";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/deudores" element={<Deudores />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </Router>
  );
}
