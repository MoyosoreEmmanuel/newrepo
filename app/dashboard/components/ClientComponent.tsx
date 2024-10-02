// ClientComponent.tsx
"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { UserButton } from "@clerk/nextjs";

export default function ClientComponent({ currentLabel }: { currentLabel: string }) {
  return (
    <header className="flex justify-between items-center p-4 md:p-6 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-xl md:text-2xl uppercase text-gray-900 dark:text-gray-100">
        {currentLabel}
      </h3>
      <div className="flex items-center space-x-4 md:space-x-6">
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
