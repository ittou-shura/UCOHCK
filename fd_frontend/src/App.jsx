import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import PaymentPage from "./pages/PaymentPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import {Toaster} from 'react-hot-toast';

export default function App() {
  return ( <>
      <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/make-payment" element={<PaymentPage />} />
        <Route path="/transaction-history" element={<TransactionHistoryPage />} />
      </Routes>
    </Router>
    <Toaster/>
  </>
    
  );
}
