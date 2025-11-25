import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Save, Trash, X } from "lucide-react";

export interface Expense {
  id?: number;
  item: string;
  qty: number;
  amount: number;
  created_at?: string;
}

const API_URL = "http://localhost:5000/api/expenses";

export default function ExpenseReport() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [rowEditData, setRowEditData] = useState<Expense>({ item: "", qty: 1, amount: 0 });

  const [expense, setExpense] = useState<Expense>({ item: "", qty: 1, amount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const res = await axios.get<Expense[]>(API_URL);
    setExpenses(res.data);
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExpense(prev => ({ ...prev, [name]: Number.isNaN(Number(value)) ? value : Number(value) }));
  };

  const addExpense = async () => {
    if (!expense.item || !expense.amount) return;
    const res = await axios.post<Expense>(API_URL, expense);
    setExpenses(prev => [res.data, ...prev]);
    setExpense({ item: "", qty: 1, amount: 0 });
  };

  // ---------- INLINE EDIT LOGIC ----------
  const startEditRow = (exp: Expense) => {
    setEditingRowId(exp.id!);
    setRowEditData({ ...exp });
  };

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRowEditData(prev => ({
      ...prev,
      [name]: name === "qty" || name === "amount" ? Number(value) : value
    }));
  };

  const saveRowUpdate = async (id: number) => {
    await axios.put(`${API_URL}/${id}`, rowEditData);
    await loadExpenses();
    setEditingRowId(null);
  };

  const cancelRowEdit = () => {
    setEditingRowId(null);
  };

  const deleteRow = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Delete this expense?")) return;
    await axios.delete(`${API_URL}/${id}`);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">📊 Expense Report</h1>

      {/* ADD FORM */}
      <div className="bg-white rounded-2xl p-6 shadow border mb-8 flex gap-4 max-w-5xl mx-auto">
        <input
          name="item"
          placeholder="Enter item name"
          className="flex-1 border rounded-xl px-4 py-3"
          value={expense.item}
          onChange={handleAddChange}
        />
        <input
          type="number"
          name="qty"
          className="w-32 border rounded-xl px-4 py-3"
          value={expense.qty}
          onChange={handleAddChange}
        />
        <input
          type="number"
          name="amount"
          className="w-40 border rounded-xl px-4 py-3"
          value={expense.amount}
          onChange={handleAddChange}
        />
        <button onClick={addExpense} className="bg-blue-600 text-white px-6 py-3 rounded-xl">+ Add</button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden max-w-5xl mx-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left font-normal text-gray-600">Date</th>
              <th className="p-4 text-left font-normal text-gray-600">Item</th>
              <th className="p-4 text-center font-normal text-gray-600">Qty</th>
              <th className="p-4 text-center font-normal text-gray-600">Amount</th>
              <th className="p-4 text-right font-normal text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} className="border-t">
                {editingRowId === exp.id ? (
                  <>
                    <td className="p-4"><input name="item" value={rowEditData.item} onChange={handleRowChange} className="border rounded-lg px-3 py-2 w-full" /></td>
                    <td className="p-4  text-center"><input type="number" name="qty" value={rowEditData.qty} onChange={handleRowChange} className="border rounded-lg px-3 py-2 w-full" /></td>
                    <td className="p-4  text-center"><input type="number" name="amount" value={rowEditData.amount} onChange={handleRowChange} className="border rounded-lg px-3 py-2 w-full" /></td>
                    <td className="p-4 flex justify-end gap-4">
                      <button
                        onClick={() => saveRowUpdate(exp.id!)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                        title="Save"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={cancelRowEdit}
                        className="p-2 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4">{exp.created_at ? new Date(exp.created_at).toLocaleDateString() : "-"}</td>
                    <td className="p-4">{exp.item}</td>
                    <td className="p-4 text-center">{exp.qty}</td>
                    <td className="p-4 text-center">₹{Number(exp.amount).toFixed(2)}</td>
                    <td className="p-4 flex justify-end gap-4">
                      <button
                        onClick={() => startEditRow(exp)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteRow(exp.id)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}