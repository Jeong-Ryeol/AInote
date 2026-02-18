"use client";

import { SessionProvider } from "next-auth/react";
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
  const width = useSidebarStore((s) => s.width);
  const isResizing = useSidebarStore((s) => s.isResizing);

  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col ${!isResizing ? "transition-[margin] duration-200" : ""}`}
          style={{ marginLeft: isOpen ? `${width}px` : 0 }}
        >
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </SessionProvider>
  );
}
