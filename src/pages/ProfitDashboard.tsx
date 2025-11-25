import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// ================= TYPES =================
interface BillRow {
  bill_id: number;
  bill_date: string;
  gsm_number: number;
  description: string;
  quantity: number;
  price: number;
  cost_price: number;
}

interface StockItem {
  id: number;
  gsm_number: number;
  category: string;
  cost_price: string;
}

interface ExpenseRow {
  id: number;
  amount: string;
  created_at: string;
}

interface LedgerRow {
  id: number | string;
  date: string;
  gsm: number | string;
  description: string;
  qty: number;
  price: number;
  cost: number;
  profitPerPiece: number;
  profit: number;
}

interface MonthlyAgg {
  month: string;
  label: string;
  profit: number;
  expense: number;
  net: number;
}

// ================= UTILS =================
const toYYYYMM = (iso: string) => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
};

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
};

// ================= COMPONENT =================
const ProfitDashboard: React.FC = () => {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [parts, setParts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [filterGsm, setFilterGsm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  // ================= FETCH DATA =================
  useEffect(() => {
    setLoading(true);

    const safeJson = async (url: string) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    Promise.all([
      safeJson("http://localhost:5000/api/profit-ledger"),
      safeJson("http://localhost:5000/api/expenses"),
      safeJson("http://localhost:5000/api/stock"),
    ]).then(([billData, expenseData, stockData]) => {
      console.log("BILL DATA FROM API:", billData);
      setBills(billData);
      setExpenses(expenseData);
      setParts(stockData);
      setLoading(false);
    });
  }, []);

  // ================= LEDGER LOGIC =================
  const allLedger: LedgerRow[] = useMemo(() => {
    return bills.map((row: any) => {
      const price = Number(row.price || 0);
      const cost = Number(row.cost_price || 0);
      const qty = Number(row.quantity || 1);

      return {
        id: row.bill_id,
        date: row.bill_date,
        gsm: row.gsm_number || "-",
        description: row.description || "-",
        qty: qty,
        price: price,
        cost: cost,
        profitPerPiece: price - cost,
        profit: (price - cost) * qty,
      };
    });
  }, [bills]);

  // ================= FILTERED LEDGER =================
  const filteredLedger = useMemo(() => {
    return allLedger.filter((row) => {
      if (fromDate && new Date(row.date) < new Date(fromDate)) return false;
      if (toDate && new Date(row.date) > new Date(toDate)) return false;
      if (filterCategory) {
        const part = parts.find((p) => p.gsm_number === row.gsm);
        if (!part || part.category !== filterCategory) return false;
      }
      return true;
    });
  }, [allLedger, fromDate, toDate, filterCategory, parts]);

  // ================= MONTHLY AGG =================
  const monthlyData: MonthlyAgg[] = useMemo(() => {
    const map = new Map<string, { profit: number; expense: number }>();

    filteredLedger.forEach((row) => {
      const m = toYYYYMM(row.date);
      if (!map.has(m)) map.set(m, { profit: 0, expense: 0 });
      map.get(m)!.profit += row.profit;
    });

    expenses.forEach((ex) => {
      const m = toYYYYMM(ex.created_at);
      if (!map.has(m)) map.set(m, { profit: 0, expense: 0 });
      map.get(m)!.expense += Number(ex.amount || 0);
    });

    return Array.from(map.entries()).map(([month, val]) => ({
      month,
      label: formatMonthLabel(month),
      profit: val.profit,
      expense: val.expense,
      net: val.profit - val.expense,
    }));
  }, [filteredLedger, expenses]);

  const totalProfit = monthlyData.reduce((s, m) => s + m.profit, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const netTotal = totalProfit - totalExpense;
  const totalSales = filteredLedger.reduce((s, r) => s + r.price, 0);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📈 Profit Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total Profit</CardTitle></CardHeader><CardContent><p className="text-green-600 text-xl font-bold">₹{totalProfit.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Expense</CardTitle></CardHeader><CardContent><p className="text-red-600 text-xl font-bold">₹{totalExpense.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Net Profit</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">₹{netTotal.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Sales</CardTitle></CardHeader><CardContent><p className="text-blue-600 text-xl font-bold">₹{totalSales.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-4 items-end">
          <div>
            <label>From</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label>To</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div>
            <label>Category</label>
            <select className="border p-2 rounded" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All</option>
              {[...new Set(parts.map(p => p.category))].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label>GSM</label>
            <select className="border p-2 rounded" value={filterGsm} onChange={e => setFilterGsm(e.target.value)}>
              <option value="">All</option>
              {parts.map(p => (
                <option key={p.id} value={p.gsm_number}>{p.gsm_number}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600">Export CSV</Button>
          <Button className="bg-blue-600">Export XLSX</Button>
          <Button className="bg-blue-600">Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Monthly Profit / Expense</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" fill="#16a34a" />
                <Bar dataKey="expense" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Net Profit Trend</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Profit Ledger</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3">Date</th>
                <th className="p-3">GSM</th>
                <th className="p-3">Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Cost</th>
                <th className="p-3">Profit/Piece</th>
                <th className="p-3">Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map(row => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 text-center">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="p-3 text-center">{row.gsm}</td>
                  <td className="p-3 text-center">{row.description}</td>
                  <td className="p-3 text-center">{row.qty}</td>
                  <td className="p-3 text-center">₹{row.price.toFixed(2)}</td>
                  <td className="p-3 text-center">₹{row.cost.toFixed(2)}</td>
                  <td className="p-3 text-center">₹{row.profitPerPiece.toFixed(2)}</td>
                  <td className="p-3 font-bold text-center">₹{row.profit.toFixed(2)}</td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
          {/* EXPENSE LEDGER */}
      <Card>
        <CardHeader><CardTitle>Expense Ledger</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3">Date</th>
                <th className="p-3">Item</th>
                <th className="p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(ex => (
                <tr key={ex.id} className="border-t">
                  <td className="p-3 text-center">{new Date(ex.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center">{(ex as any).item || "-"}</td>
                  <td className="p-3 font-bold text-center">₹{Number(ex.amount).toFixed(2)}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDashboard;
