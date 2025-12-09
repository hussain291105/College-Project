import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getStock } from "@/api/stock";
import { printBillInvoice } from "@/lib/BillingPrint";

// ================= TYPES =================
interface StockItem {
  id: number;
  gsm_number: number;
  description: string;
  selling_price: number;
  stock: number;
  unit: string;
}

interface BillItem {
  gsm_number: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

// ================= COMPONENT =================
export default function BillingForm() {
  const navigate = useNavigate();

  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [filteredDescriptions, setFilteredDescriptions] = useState<StockItem[]>([]);
  const [selectedGSM, setSelectedGSM] = useState<string>("");
  const [selectedDescription, setSelectedDescription] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<StockItem | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customerName, setCustomerName] = useState("");

  // ⭐ NEW: CUSTOMER NAME HISTORY
  const [customerNames, setCustomerNames] = useState<string[]>([]);

  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState("");
  const [status, setStatus] = useState("Pending");

  const [savedBillNumber, setSavedBillNumber] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ============ LOAD STOCK ============
  useEffect(() => {
    loadStock();
  }, []);

  async function loadStock() {
    try {
      const data = await getStock();
      setStockList(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock");
    }
  }

  // ⭐ NEW: LOAD SAVED CUSTOMER NAMES
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("customerNames") || "[]");
    setCustomerNames(list);
  }, []);

  // ⭐ NEW: CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⭐ NEW: FUNCTION TO SAVE CUSTOMER TO LOCAL STORAGE
  function saveCustomerName(name: string) {
    if (!name) return;

    let list = JSON.parse(localStorage.getItem("customerNames") || "[]");

    if (!list.some((n: string) => n.toLowerCase() === name.toLowerCase())) {
      list.push(name);
      localStorage.setItem("customerNames", JSON.stringify(list));
    }
  }

  // ============ ITEM SELECTION ============
  function onGsmChange(val: string) {
    setSelectedGSM(val);
    setSelectedDescription("");
    setSelectedPart(null);
    setCustomPrice("");

    const filtered = stockList.filter(s => String(s.gsm_number) === val);
    setFilteredDescriptions(filtered);
  }

  function onDescriptionChange(desc: string) {
    setSelectedDescription(desc);
    const part = filteredDescriptions.find(p => p.description === desc);

    if (part) {
      setSelectedPart(part);
      setCustomPrice(part.selling_price);
    } else {
      setSelectedPart(null);
    }
  }

  // ============ ADD ITEM ============
  function addItem() {
    if (!selectedPart) {
      toast.error("Select GSM and Description");
      return;
    }

    const price =
      customPrice !== "" && Number(customPrice) > 0
        ? Number(customPrice)
        : selectedPart.selling_price;

    const newItem: BillItem = {
      gsm_number: selectedPart.gsm_number,
      description: selectedPart.description,
      quantity,
      price,
      total: price * quantity,
    };

    setBillItems(prev => [...prev, newItem]);

    setQuantity(1);
    setCustomPrice("");
    setSelectedGSM("");
    setSelectedDescription("");
    setSelectedPart(null);
    setFilteredDescriptions([]);
  }

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);

  // ============ SAVE BILL ============
  async function saveBill() {
    if (!customerName || !paymentMode || !status || !billDate) {
      toast.error("Fill all bill details");
      return;
    }

    if (billItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setSaving(true);

    const payload = {
      customer_name: customerName,
      payment_mode: paymentMode,
      status,
      bill_date: billDate,
      subtotal,
      items: billItems.map(i => ({
        gsm_number: Number(i.gsm_number),
        description: i.description,
        quantity: Number(i.quantity),
        price: Number(i.price),
        total: Number(i.total),
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to save bill");
        return;
      }

      const billNumber =
        data.bill_number || `INV-${String(data.id).padStart(4, "0")}`;
      setSavedBillNumber(billNumber);

      // ⭐ NEW: SAVE CUSTOMER NAME
      saveCustomerName(customerName);

      toast.success(`Bill saved successfully (${billNumber})`);
      navigate("/billing");
    } catch (err) {
      console.error("SAVE BILL ERROR:", err);
      toast.error("Server error while saving bill");
    } finally {
      setSaving(false);
    }
  }

  // ================= UI =================
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add New Bill</h1>
        <Button variant="destructive" onClick={() => navigate("/billing")}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>

      {/* ⭐ UPDATED CUSTOMER NAME FIELD */}
      <div ref={dropdownRef} className="relative max-w-md">
        <Input
          placeholder="Customer Name"
          value={customerName}
          onChange={e => {
            setCustomerName(e.target.value)
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full"
        />

        {/* Dropdown */}
        {showSuggestions && customerName.length > 0 && (
          <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {customerNames
              .filter((n) =>
                n.toLowerCase().includes(customerName.toLowerCase())
              )
              .map((name, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setCustomerName(name);
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {name}
                </div>
              ))}

              {/* If no match, show option */}
            {customerNames.filter((n) =>
              n.toLowerCase().includes(customerName.toLowerCase())
              ).length === 0 && (
              <div className="px-3 py-2 text-gray-400">No suggestions</div>
              )}
          </div>
        )}
      </div>

      <Input
        type="date"
        value={billDate}
        onChange={e => setBillDate(e.target.value)}
        className="w-48"
      />

      <div className="flex gap-4 mt-4">
        <select
          value={paymentMode}
          onChange={e => setPaymentMode(e.target.value)}
          className="border rounded-md p-2 w-44"
        >
          <option value="">Select Payment Mode</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border rounded-md p-2 w-44"
        >
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Pending">New Invoice</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <select value={selectedGSM} onChange={e => onGsmChange(e.target.value)} className="border rounded-md p-2 w-64">
          <option value="">Select GSM</option>
          {Array.from(new Set(stockList.map(s => String(s.gsm_number)))).map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={selectedDescription} disabled={!filteredDescriptions.length} onChange={e => onDescriptionChange(e.target.value)} className="border rounded-md p-2 w-64">
          <option value="">Select Description</option>
          {filteredDescriptions.map(p => <option key={p.id} value={p.description}>{p.description}</option>)}
        </select>

        <Input type="number" min={1} className="w-24" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        <Input type="number" className="w-32" value={customPrice} onChange={e => setCustomPrice(e.target.value ? Number(e.target.value) : "")} placeholder="Price" />
        <Button onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
      </div>

      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Bill Items</h3>
        {billItems.length === 0 ? <p>No items added</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>GSM</th><th>Description</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((i, idx) => (
                <tr key={idx} className="border-b">
                  <td>{i.gsm_number}</td>
                  <td>{i.description}</td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">₹{i.price.toFixed(2)}</td>
                  <td className="text-right">₹{i.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="text-lg font-semibold">Total: ₹{subtotal.toFixed(2)}</div>
        <div className="flex gap-3">
          <Button
            onClick={() =>
              printBillInvoice({
                billNumber: savedBillNumber ?? "",
                customerName,
                billDate,
                paymentMode,
                items: billItems,
                subtotal,
                status,
              })
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Bill
          </Button>
          <Button onClick={saveBill} className="bg-green-600 hover:bg-green-700" disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Bill"}</Button>
        </div>
      </div>
    </div>
  );
}