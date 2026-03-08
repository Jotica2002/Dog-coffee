import { ReactNode } from "react";
import MobileNav from "./MobileNav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <MobileNav />
    </div>
  );
}
