"use client";

import { SessionProvider } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className={cn(
            "flex-1 flex flex-col transition-[margin] duration-200",
            isOpen ? "ml-60" : "ml-0"
          )}
        >
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </SessionProvider>
  );
}
