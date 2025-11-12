import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SparePart {
  id: string;
  gsm_number: string;
  price: number;
  stock_quantity: number;
  unit: string;
}

interface BillItem {
  id: string;
  gsm_number: string;
  quantity: number;
  price: number;
  total: number;
}

const BillingForm = () => {
  const [billNumber, setBillNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [billDate, setBillDate] = useState("");
  const [parts, setParts] = useState<SparePart[]>([]);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchParts();
    setBillNumber("INV-" + Date.now().toString().slice(-6));
    setBillDate(new Date().toLocaleString());
  }, []);

  const fetchParts = async () => {
    const { data, error } = await supabase.from("spare_parts").select("*");
    if (error) toast.error("Failed to load parts");
    else setParts(data || []);
  };

  const addItem = () => {
    if (!selectedPart) return toast.error("Select a part first");
    const price = customPrice && customPrice > 0 ? Number(customPrice) : selectedPart.price;
    const newItem = {
      id: selectedPart.id + "-" + Math.random(), // Ensure unique key
      gsm_number: selectedPart.gsm_number,
      quantity,
      price,
      total: price * quantity,
    };
    setBillItems([...billItems, newItem]);
    setSelectedPart(null);
    setQuantity(1);
    setCustomPrice("");
  };

  const subtotal = billItems.reduce((sum, i) => sum + i.total, 0);

  const saveBill = async () => {
    try {
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([
          {
            bill_number: billNumber,
            customer_name: customerName || "N/A",
            total_amount: subtotal,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (billError || !billData) throw billError;

      const itemsData = billItems.map((item) => ({
        bill_id: billData.id,
        gsm_number: item.gsm_number,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase.from("bill_items").insert(itemsData);
      if (itemsError) throw itemsError;

      toast.success("✅ Bill saved successfully!");
      navigate("/billing");
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    }
  };

  // ✅ Print Invoice
  const handlePrint = () => {
    if (billItems.length === 0) {
      toast.error("No items to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = billItems
      .map(
        (item, index) => `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="text-align:center;">${item.gsm_number}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
            <td style="text-align:right;">₹${item.total.toFixed(2)}</td>
          </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${billNumber}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 6px; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <h2>Fresh Soft Tissue Enterprises</h2>
            <p>All Kind of Engine & Suspension Items</p>
            <h3 style="display:inline-block; border:1px solid #000; padding:3px;">CREDIT INVOICE</h3>
          </div>

          <p><strong>Invoice #:</strong> ${billNumber}</p>
          <p><strong>Customer:</strong> ${customerName || "N/A"}</p>
          <p><strong>Date:</strong> ${billDate}</p>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>GSM Number</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="text-align:right; margin-top:10px;">
            <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
            <p><strong>Net Amount:</strong> ₹${subtotal.toFixed(2)}</p>
          </div>

          <div style="margin-top:30px; display:flex; justify-content:space-between;">
            <p>Receiver ___________________</p>
            <p>Signature ___________________</p>
          </div>

          <p style="text-align:center; margin-top:20px;">Shuwaikh Industrial Area, Opp. Garage Noor</p>

          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add New Bill</h1>
        <Button variant="destructive" onClick={() => navigate("/billing")}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>

      <Input
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="max-w-md"
      />

      {/* Part Selection */}
      <div className="flex items-center gap-3">
        <select
          className="border rounded-md p-2 w-64"
          value={selectedPart ? selectedPart.id : ""}
          onChange={(e) => {
            const part = parts.find((p) => p.id === e.target.value);
            setSelectedPart(part || null);
          }}
        >
          <option value="">Select GSM Number...</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.gsm_number}
            </option>
          ))}
        </select>

        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24"
          placeholder="Qty"
        />

        <Input
          type="number"
          min={0}
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : "")}
          className="w-32"
          placeholder="Price"
        />

        <Button onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Bill Items */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Bill Items</h3>
        {billItems.length === 0 ? (
          <p className="text-sm text-gray-500">No items added yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">GSM</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.gsm_number}</td>
                  <td className="text-right p-2">{i.quantity}</td>
                  <td className="text-right p-2">₹{i.price.toFixed(2)}</td>
                  <td className="text-right p-2">₹{i.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals & Actions */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-lg font-semibold">Total: ₹{subtotal.toFixed(2)}</div>
        <div className="flex gap-3">
          <Button
            onClick={handlePrint}
            disabled={billItems.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Invoice
          </Button>

          <Button
            onClick={saveBill}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-1" /> Save Bill
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingForm;
