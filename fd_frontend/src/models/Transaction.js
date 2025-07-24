// models/Transaction.js

export class Transaction {
  constructor({ sender, receiver, value, time, is_fraud, risk_level, ip_address, location }) {
    this.sender = sender;
    this.receiver = receiver;
    this.value = Number(value);
    this.time = time;
    this.is_fraud = is_fraud ?? "false";
    this.risk_level = risk_level ?? "low";
    this.ip_address = ip_address ?? "-";
    this.location = location ?? "Unknown";
  }
}