import React from "react";
import { Bell, UserCircle } from "lucide-react";

export function Topbar() {
  return (
    <header className="bg-blue-900 text-white shadow-md h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-yellow-400">Welcome, John</h1>
      <div className="flex items-center gap-4">
        <button className="hover:text-yellow-400 transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <UserCircle size={28} />
          <span className="text-sm">John Doe</span>
        </div>
      </div>
    </header>
  );
}
