import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchTransactions } from "../api/transaction"; // ✅ your backend fetch
import { Transaction } from "../models/Transaction"; // ✅ your model
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample card data
const cards = [
  {
    id: 1,
    balance: "₹5,756",
    holder: "Eddy Cusuma",
    valid: "12/22",
    theme: "from-blue-600 to-blue-400",
  },
  {
    id: 2,
    balance: "₹3,210",
    holder: "Alex Morgan",
    valid: "11/23",
    theme: "from-yellow-500 to-yellow-300",
  },
];

const balanceData = [
  { day: "Mon", balance: 500 },
  { day: "Tue", balance: 650 },
  { day: "Wed", balance: 700 },
  { day: "Thu", balance: 550 },
  { day: "Fri", balance: 800 },
  { day: "Sat", balance: 750 },
  { day: "Sun", balance: 900 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [recentTxns, setRecentTxns] = useState([]);

  useEffect(() => {
    fetchTransactions()
      .then((data) => {
        const txList = data.map((tx) => new Transaction(tx));
        txList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentTxns(txList.slice(0, 4)); // get top 4
      })
      .catch((err) => console.error("Failed to load transactions", err));
  }, []);

  return (
    <div className="flex h-screen bg-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Overview" />

        <main className="p-6 overflow-auto">
          {/* My Cards */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">My Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.03 }}
                  className={`rounded-2xl p-6 bg-gradient-to-br ${card.theme} text-white shadow-lg relative overflow-hidden`}
                >
                  <CreditCard
                    size={32}
                    className="opacity-20 absolute top-4 right-4"
                  />
                  <p className="text-sm uppercase opacity-80">Balance</p>
                  <p className="text-3xl font-semibold my-2">{card.balance}</p>
                  <div className="flex justify-between text-xs opacity-80">
                    <div>
                      <p>Card Holder</p>
                      <p>{card.holder}</p>
                    </div>
                    <div>
                      <p>Valid Thru</p>
                      <p>{card.valid}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Recent Transactions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/transaction-history")}
                  >
                    See All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {recentTxns.length > 0 ? (
                    recentTxns.map((tx, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium">{tx.receiver}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p
                          className={`font-semibold ${
                            tx.risk_level === "high"
                              ? "text-red-500"
                              : tx.risk_level === "med"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          ₹ {tx.value}
                        </p>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No recent transactions
                    </p>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Balance Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="font-semibold">Balance Over Time</h3>
              </CardHeader>
              <CardContent style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#2563EB"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
