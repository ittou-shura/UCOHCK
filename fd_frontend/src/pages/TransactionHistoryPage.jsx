import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { fetchTransactions } from "../api/transaction";
import { Transaction } from "../models/Transaction";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // calculate rows per viewport
  useEffect(() => {
    const rowHeight   = 48;
    const offset      = 250;
    const rows        = Math.max(5, Math.floor((window.innerHeight - offset) / rowHeight));
    setEntriesPerPage(rows);
  }, []);

  // fetch from Express
  useEffect(() => {
    fetchTransactions()
      .then(data => setTransactions(data.map(tx => new Transaction(tx))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(transactions.length / entriesPerPage);
  const startIdx   = (currentPage - 1) * entriesPerPage;
  const pageTx     = transactions.slice(startIdx, startIdx + entriesPerPage);

  const formatTime = (tx) => {
    if (tx.created_at) {
      return new Date(tx.created_at).toLocaleString();
    }
    // ISO‐string fallback
    if (typeof tx.time === "string" && !isNaN(Date.parse(tx.time))) {
      return new Date(tx.time).toLocaleString();
    }
    // hour fallback
    if (typeof tx.time === "number") {
      return `${tx.time}:00`;
    }
    return tx.time ?? "—";
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 bg-white min-h-screen">
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Recent Transactions</h1>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="px-4 py-2">Receiver</th>
                      <th className="px-4 py-2">Amount (₹)</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Risk</th>
                      <th className="px-4 py-2">IP Address</th>
                      <th className="px-4 py-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageTx.length > 0 ? (
                      pageTx.map((tx, i) => (
                        <tr key={i} className="text-center border-t">
                          <td className="px-4 py-2">{tx.receiver}</td>

                          {/* Amount */}
                          <td className={`px-4 py-2 font-semibold ${
                            tx.risk_level === "high"
                              ? "text-red-600"
                              : tx.risk_level === "med"
                              ? "text-yellow-500"
                              : "text-green-600"
                          }`}>
                            ₹ {tx.amount.toLocaleString()}
                          </td>

                          {/* Time */}
                          <td className="px-4 py-2">{formatTime(tx)}</td>

                          <td className="px-4 py-2">
                            {tx.is_fraud === "true" ? "🚩" : "✔️"}
                          </td>
                          <td className="px-4 py-2">{tx.risk_level}</td>
                          <td className="px-4 py-2">{tx.ip_address}</td>
                          <td className="px-4 py-2">{tx.location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-4 text-center">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-100 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-blue-900 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-100 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
