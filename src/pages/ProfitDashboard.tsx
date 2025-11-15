import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
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

// ProfitDashboard.tsx
// - Shows summary cards (Total Profit / Total Expense / Net Profit / Best/Worst month)
// - Monthly charts (Profit / Expense / Net)
// - Filters (date range, category, gsm)
// - Ledger table (profit per sale)
// - Export options (CSV, XLSX, PDF — XLSX/PDF optional libs)

// NOTE: This file expects the following Supabase tables exist:
// - "bills" (id, bill_number, customer_name, total_amount, created_at)
// - "bill_items" (id, bill_id, gsm_number, quantity, price, total, created_at)
// - "expenses" (id, item, qty, amount, created_at)
// - "spare_parts" (id, gsm_number, category, price, cost_price, ...)

// You may need to `npm i recharts xlsx jspdf jspdf-autotable` to enable all export features.

interface BillRow {
  id: string;
  bill_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string; // ISO
}

interface BillItemRow {
  id: string;
  bill_id: string;
  gsm_number: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

interface ExpenseRow {
  id: string;
  item: string;
  qty: number;
  amount: number;
  created_at: string;
}

interface SparePart {
  id: string;
  gsm_number: string;
  category: string | null;
  price: number;
  cost_price: number | null;
}

type MonthlyAgg = {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2025"
  profit: number;
  expense: number;
  net: number;
};

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString(undefined, { month: "short", year: "numeric" });
};

const toYYYYMM = (iso: string) => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
};

const ProfitDashboard: React.FC = () => {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [items, setItems] = useState<BillItemRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);

  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterGsm, setFilterGsm] = useState<string>("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: billsData, error: billsError } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (billsError) throw billsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("bill_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;

      const { data: partsData, error: partsError } = await supabase
        .from("spare_parts")
        .select("id, gsm_number, category, price, cost_price");

      if (partsError) throw partsError;

      setBills(billsData || []);
      setItems(itemsData || []);
      setExpenses(expensesData || []);
      setParts(partsData || []);
    } catch (err: any) {
      console.error("Failed to fetch data", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters on items/expenses
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (filterGsm && it.gsm_number !== filterGsm) return false;
      if (fromDate && new Date(it.created_at) < new Date(fromDate)) return false;
      if (toDate && new Date(it.created_at) > new Date(toDate)) return false;
      if (filterCategory) {
        const part = parts.find((p) => p.gsm_number === it.gsm_number);
        if (!part || (part.category || "") !== filterCategory) return false;
      }
      return true;
    });
  }, [items, filterGsm, fromDate, toDate, filterCategory, parts]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (fromDate && new Date(ex.created_at) < new Date(fromDate)) return false;
      if (toDate && new Date(ex.created_at) > new Date(toDate)) return false;
      return true;
    });
  }, [expenses, fromDate, toDate]);

  // Build monthly aggregates for chart
  const monthlyData: MonthlyAgg[] = useMemo(() => {
    const months = new Map<string, { profit: number; expense: number }>();

    // Items -> profit contribution: (selling price - cost_price) * qty
    for (const it of filteredItems) {
      const month = toYYYYMM(it.created_at);
      const part = parts.find((p) => p.gsm_number === it.gsm_number);
      const cost = part?.cost_price || 0;
      const sell = it.price || 0;
      const profitPerUnit = sell - cost;
      const profit = profitPerUnit * it.quantity;

      if (!months.has(month)) months.set(month, { profit: 0, expense: 0 });
      const cur = months.get(month)!;
      cur.profit += profit;
    }

    // Expenses -> add to expense
    for (const ex of filteredExpenses) {
      const month = toYYYYMM(ex.created_at);
      if (!months.has(month)) months.set(month, { profit: 0, expense: 0 });
      const cur = months.get(month)!;
      cur.expense += ex.amount;
    }

    // Convert to array in ascending month order
    const arr = Array.from(months.entries())
      .map(([month, v]) => ({ month, profit: v.profit, expense: v.expense }))
      .sort((a, b) => (a.month > b.month ? 1 : -1));

    return arr.map((r) => ({
      month: r.month,
      label: formatMonthLabel(r.month),
      profit: Number(r.profit.toFixed(2)),
      expense: Number(r.expense.toFixed(2)),
      net: Number((r.profit - r.expense).toFixed(2)),
    }));
  }, [filteredItems, filteredExpenses, parts]);

  // Summary numbers
  const totalProfit = monthlyData.reduce((s, m) => s + m.profit, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const netTotal = totalProfit - totalExpense;

  const bestMonth = monthlyData.reduce((best, m) => (m.net > (best?.net ?? -Infinity) ? m : best), null as MonthlyAgg | null);
  const worstMonth = monthlyData.reduce((worst, m) => (m.net < (worst?.net ?? Infinity) ? m : worst), null as MonthlyAgg | null);

  // Export helpers
  const exportCSV = () => {
    // Build CSV: month, profit, expense, net
    const rows = ["Month,Profit,Expense,Net", ...monthlyData.map((m) => `${m.label},${m.profit},${m.expense},${m.net}`)];
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = async () => {
    try {
      const XLSX = (await import("xlsx")).default;
      const ws = XLSX.utils.json_to_sheet(monthlyData.map((m) => ({ Month: m.label, Profit: m.profit, Expense: m.expense, Net: m.net })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ProfitReport");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profit-report-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn(err);
      toast.error("Please install xlsx (SheetJS) to enable XLSX export: npm i xlsx");
    }
  };

  const exportPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.text("Profit Report", 40, 40);
      const head = [["Month", "Profit", "Expense", "Net"]];
      const body = monthlyData.map((m) => [m.label, m.profit, m.expense, m.net]);
      // @ts-ignore
      autoTable(doc, { startY: 60, head, body });
      doc.save(`profit-report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.warn(err);
      toast.error("Please install jspdf and jspdf-autotable to enable PDF export: npm i jspdf jspdf-autotable");
    }
  };

  // Ledger rows: show each sale item with computed profit
  const ledger = useMemo(() => {
    return filteredItems.map((it) => {
      const part = parts.find((p) => p.gsm_number === it.gsm_number);
      const cost = part?.cost_price || 0;
      const profitPerPiece = it.price - cost;
      return {
        id: it.id,
        bill_id: it.bill_id,
        gsm: it.gsm_number,
        qty: it.quantity,
        price: it.price,
        cost,
        profit: Number((profitPerPiece * it.quantity).toFixed(2)),
        profitPerPiece: Number(profitPerPiece.toFixed(2)),
        date: it.created_at,
      };
    });
  }, [filteredItems, parts]);

  const uniqueProfitPerPiece = useMemo(() => {
  const map = new Map<string, number>(); // gsm → profitPerPiece

  // From sales
  ledger.forEach((item) => {
    const profitPerPiece = item.price - item.cost;
    map.set(item.gsm, profitPerPiece);
  });

  // Sum all profit-per-piece values
  return Array.from(map.values()).reduce((sum, p) => sum + p, 0);
}, [ledger]);

  const totalPiecesSold = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📈 Profit Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{totalProfit.toFixed(2)}</p>
            <p className="text-muted-foreground">Across selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{totalExpense.toFixed(2)}</p>
            <p className="text-muted-foreground">Across selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{netTotal.toFixed(2)}</p>
            <p className="text-muted-foreground">Total Profit - Total Expense</p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Profit Per Piece</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                ₹{uniqueProfitPerPiece.toFixed(2)}
                </p>
                <p className="text-muted-foreground">Average profit per item sold</p>
            </CardContent>
        </Card>
      </div>

      {/* Filters + Exports */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block mb-1">From</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block mb-1">To</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

        <div>
          <label className="text-sm block mb-1">Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {Array.from(new Set(parts.map((p) => p.category || "").filter(Boolean))).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">GSM</label>
          <select value={filterGsm} onChange={(e) => setFilterGsm(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {parts.map((p) => (
              <option key={p.id} value={p.gsm_number}>{p.gsm_number}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <Button onClick={exportCSV}>Export CSV</Button>
          <Button onClick={exportXLSX}>Export XLSX</Button>
          <Button onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit / Expense</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" name="Profit" fill="#16a34a" />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit (Line)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="net" stroke="#0ea5e9" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3">Date</th>
                  <th className="p-3">GSM</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Profit / Piece</th>
                  <th className="p-3">Profit</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 align-top">{new Date(r.date).toLocaleString()}</td>
                    <td className="p-3 align-top">{r.gsm}</td>
                    <td className="p-3 align-top">{r.qty}</td>
                    <td className="p-3 align-top">₹{r.price.toFixed(2)}</td>
                    <td className="p-3 align-top">₹{r.cost.toFixed(2)}</td>
                    <td className="p-3 align-top">₹{r.profitPerPiece.toFixed(2)}</td>
                    <td className="p-3 align-top">₹{r.profit.toFixed(2)}</td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No data for the selected filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDashboard;
