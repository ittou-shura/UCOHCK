import { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import creditCardImg from "../assets/credit-card.png";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const [receiver, setReceiver]     = useState("");
  const [amount, setAmount]         = useState("");
  const [risk, setRisk]             = useState(null);
  const [error, setError]           = useState("");
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState("");
  const [verifying, setVerifying]   = useState(false);
  const [pendingTx, setPendingTx]   = useState(null);

  useEffect(() => {
    if (!risk) return;
    if (risk === "Low") {
      toast.success("Payment successful!");
      resetForm();
    } else if (risk === "High") {
      toast.error("Payment blocked");
      resetForm();
    } else if (risk === "Medium") {
      setOtpSent(true);
      toast("OTP sent to your phone. Please verify.", { icon: "🔑" });
    }
  }, [risk]);

  const resetForm = () => {
    setReceiver("");
    setAmount("");
    setRisk(null);
    setOtpSent(false);
    setOtp("");
    setPendingTx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRisk(null);
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
          amount: parseInt(amount, 10),
          time: new Date().toISOString(),
          ip_address: ip,
          location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
      if (data.otp_sent) setPendingTx(data.tx);
      setRisk(data.tx?.risk_level);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch("http://localhost:5000/verify-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // --- REMOVE THE LINE BELOW ---
          // to: process.env.NEXT_PUBLIC_OTP_RECIPIENT,
          
          // --- KEEP THESE TWO LINES ---
          code: otp,
          transaction: pendingTx,
        }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        toast.success("Payment successful!");
      } else {
        toast.error(data.error || "Payment blocked");
      }
    } catch (err) {
      console.error("Verification fetch failed:", err);
      let errorMessage = "Payment blocked after verification attempt.";
      if (err instanceof SyntaxError) {
        errorMessage = "Server returned an invalid response. Check server logs.";
      }
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
      resetForm();
    }
  };

  // No changes to JSX
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
                  type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-300"
                  required disabled={Boolean(otpSent)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Amount (₹)</label>
                <input
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-300"
                  required disabled={Boolean(otpSent)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-400 text-blue-900 py-2 rounded hover:bg-yellow-500"
                disabled={Boolean(otpSent)}
              >
                PAY
              </button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {otpSent && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-white">Enter OTP</label>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 border border-blue-200 rounded text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400"
                    placeholder="6-digit code"
                  />
                  <button
                    onClick={handleVerify}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    disabled={verifying || otp.length !== 6 || !pendingTx}
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}