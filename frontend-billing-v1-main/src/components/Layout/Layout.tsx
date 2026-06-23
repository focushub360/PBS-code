import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#050816]">
      <Header />

      <main className="flex-1 transition-all duration-300 ease-in-out w-full">
        <div className="p-2 sm:p-4 pb-20 lg:pb-4 max-w-full">
          <div className="mx-auto max-w-full">{children}</div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};