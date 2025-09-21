import { ReactNode } from "react";
import Navigation from "./Navigation";
import SupportWidget from "./SupportWidget";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <SupportWidget />
    </div>
  );
};

export default Layout;