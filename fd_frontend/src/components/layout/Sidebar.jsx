// src/components/layout/Sidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Home, BarChart2, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: <Home size={20} />, path: "/" },
  { name: "Make Payment", icon: <Home size={20} />, path: "/make-payment" },
  { name: "Transaction History", icon: <BarChart2 size={20} />, path: "/transaction-history" },
  { name: "Reports", icon: <BarChart2 size={20} />, path: "/reports" },
  { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
];

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-64 bg-blue-900 text-white flex flex-col shadow-xl"
    >
      <div className="text-yellow-400 text-2xl font-bold px-6 py-4 border-b border-blue-700">
        UCO Bank
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-yellow-400 text-blue-900 font-semibold"
                  : "hover:bg-blue-800 hover:text-yellow-300"
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}
