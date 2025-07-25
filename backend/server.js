import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import { Transaction } from "./models/Transaction.js";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const app = express();
const PORT = 5000;
const CSV_FILE = "./data/transactions.csv";
const FLASK_URL = "http://localhost:5001/assess";  // your Flask endpoint

app.use(cors());
app.use(bodyParser.json());

// Helper: Read transactions from CSV
function readTransactions() {
  if (!fs.existsSync(CSV_FILE)) return [];
  const csvData = fs.readFileSync(CSV_FILE);
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });
  return records.map((row) => new Transaction(row));
}

// Helper: Write transactions to CSV
function writeTransactions(transactions) {
  const rows = transactions.map((t) => ({ ...t }));
  const csv = stringify(rows, { header: true });
  fs.writeFileSync(CSV_FILE, csv);
}

// GET /transactions
app.get("/transactions", (req, res) => {
  const transactions = readTransactions();
  res.json(transactions);
});

// POST /transactions → forward to Flask → store + respond
app.post("/transactions", async (req, res) => {
  try {
    // 1) Build base transaction
    const { ...txData } = req.body;

    // 2) Forward to Flask ML service
    const flaskRes = await axios.post(FLASK_URL, txData);
    const { risk, probabilities, flags } = flaskRes.data;

    // 3) Enrich and persist
    const tx = new Transaction({
      ...txData,
      risk_level:risk,
      // probabilities: JSON.stringify(probabilities),
      is_fraud: flags,
    });

    const transactions = readTransactions();
    transactions.unshift(tx);
    writeTransactions(transactions);

    // 4) Return the enriched transaction
    res.status(201).json(tx);

  } catch (err) {
    console.error("❌ Full error object:", err.response?.data || err);
    const status   = err.response?.status || 500;
    const errorMsg = err.response?.data?.error  || err.message || "Internal server error";
    res.status(status).json({ error: errorMsg });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
