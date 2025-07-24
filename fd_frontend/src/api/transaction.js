const BASE_URL = "http://localhost:5000"; // adjust if your backend is on a different port

export async function fetchTransactions() {
  const res = await fetch(`${BASE_URL}/transactions`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return await res.json();
}
