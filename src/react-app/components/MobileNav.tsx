import { Link, useLocation } from "react-router";
import { Home, PlusCircle, List, Users, Settings } from "lucide-react";

const navItems = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/registro", label: "Registro", icon: PlusCircle },
  { path: "/historial", label: "Historial", icon: List },
  { path: "/deudores", label: "Deudores", icon: Users },
  { path: "/configuracion", label: "Config", icon: Settings },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
