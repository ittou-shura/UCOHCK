import React, { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import creditCardImg from "../assets/credit-card.png";

export default function PaymentPage() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [riskResult, setRiskResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRiskResult(null);

    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipRes.json();

      const locRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const locData = await locRes.json();
      const location = `${locData.city || ""}, ${locData.region || ""}`;

      const res = await fetch("http://localhost:5000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "You",
          receiver,
          value: parseInt(amount, 10),
          time: new Date().toISOString(),
          ip_address: ip,
          location
        }),
      });

      const text = await res.text();
      console.log("Raw API response text:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Status ${res.status}`);
      }

      setRiskResult({
        risk: data.risk,
        probabilities: data.probs,
        flags: data.flags,
      });

      setReceiver("");
      setAmount("");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex flex-col md:flex-row items-center justify-center bg-white min-h-screen p-6">
          <div className="hidden md:block w-full md:w-1/2 p-8">
            <img src={creditCardImg} alt="Credit Card" />
          </div>
          <div className="w-full md:w-1/2 bg-blue-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Your payment details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Pay To</label>
                <input
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="Anjul Dandekar"
                  className="mt-1 w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  className="mt-1 w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-400 text-blue-900 py-2 rounded hover:bg-yellow-500"
              >
                PAY
              </button>
            </form>
            {error && <p className="text-red-400 mt-4">Error: {error}</p>}
            {riskResult && (
              <div className="mt-6 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Risk Assessment</h3>
                <p>Risk: {riskResult.risk}</p>
                <p>Probabilities:</p>
                <ul className="list-disc list-inside">
                  <li>XGB: {riskResult.probabilities.xgb.toFixed(3)}</li>
                  <li>NN: {riskResult.probabilities.nn.toFixed(3)}</li>
                  <li>Ensemble: {riskResult.probabilities.ensemble.toFixed(3)}</li>
                </ul>
                <p>Flags:</p>
                <ul className="list-disc list-inside">
                  <li>Amount/Time: {riskResult.flags.amount_time ? 'UNUSUAL' : 'normal'}</li>
                  <li>Location: {riskResult.flags.location ? 'UNUSUAL' : 'normal'}</li>
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
