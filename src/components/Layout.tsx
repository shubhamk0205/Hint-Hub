import { ReactNode } from "react";
import Navigation from "./Navigation";
import BuyMeACoffee from "./BuyMeACoffee";

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
      <BuyMeACoffee />
    </div>
  );
};

export default Layout;