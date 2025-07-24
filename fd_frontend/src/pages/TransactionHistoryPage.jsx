import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { fetchTransactions } from "../api/transaction";
import { Transaction } from "../models/Transaction";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10); // default, will be calculated

  // Dynamically calculate rows per page based on viewport
  useEffect(() => {
    const rowHeight = 48; // approx px per table row
    const tableOffset = 250; // estimated space taken by headers/topbar/sidebar
    const usableHeight = window.innerHeight - tableOffset;
    const rows = Math.floor(usableHeight / rowHeight);
    setEntriesPerPage(Math.max(rows, 5)); // set a minimum of 5
  }, []);

  useEffect(() => {
    fetchTransactions()
      .then((data) => {
        const formatted = data.map((tx) => new Transaction(tx));
        setTransactions(formatted);
      })
      .catch((err) => console.error("Error fetching transactions:", err))
      .finally(() => setLoading(false));
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const currentTransactions = transactions.slice(startIdx, startIdx + entriesPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
                      <th className="px-4 py-2">Sender</th>
                      <th className="px-4 py-2">Receiver</th>
                      <th className="px-4 py-2">Amount (₹)</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">IP Address</th>
                      <th className="px-4 py-2">Location</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentTransactions.length > 0 ? (
                      currentTransactions.map((tx, index) => (
                        <tr key={index} className="text-center border-t">
                          <td className="px-4 py-2">{tx.sender}</td>
                          <td className="px-4 py-2">{tx.receiver}</td>
                          <td
                            className={`px-4 py-2 font-semibold ${
                              tx.risk_level === "high"
                                ? "text-red-600"
                                : tx.risk_level === "med"
                                ? "text-yellow-500"
                                : "text-green-600"
                            }`}
                          >
                            ₹ {tx.value}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(tx.time).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            {tx.is_fraud === "true" ? "🚩" : "✔️"}
                          </td>
                          <td className="px-4 py-2">{tx.ip_address}</td>
                          <td className="px-4 py-2">{tx.location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-100 text-blue-900 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-blue-900 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-100 text-blue-900 rounded disabled:opacity-50"
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
