import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { printBillInvoice } from "@/lib/BillingPrint";

interface StockItem {
  id: number;
  gsm_number: number;
  description: string;
  selling_price: number;
}

interface BillItem {
  id: number;
  bill_id: number;
  gsm_number: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

const BillingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [billNumber, setBillNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [billDate, setBillDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [status, setStatus] = useState("");

  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const [selectedGSM, setSelectedGSM] = useState("");
  const [availableDescriptions, setAvailableDescriptions] = useState<StockItem[]>([]);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | "">("");

  const subtotal = billItems.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  // -------------------------------------------------------
  // GET BILL DETAILS
  // -------------------------------------------------------
  const loadBill = async () => {
    try {
      const billRes = await fetch(`http://localhost:5000/api/billing/${id}`);
      const bill = await billRes.json();

      setBillNumber(bill.bill_number);
      setCustomerName(bill.customer_name);
      setBillDate(bill.bill_date?.split("T")[0]);
      setPaymentMode(bill.payment_mode || "");
      setStatus(bill.status || "");
    } catch (err) {
      toast.error("Failed to load bill");
    }
  };

  // -------------------------------------------------------
  // GET BILL ITEMS
  // -------------------------------------------------------
  const loadBillItems = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/billing/${id}/items`);
      const items = await res.json();

      const normalized = Array.isArray(items)
        ? items.map(i => ({
          ...i,
          price: Number(i.price),
          total: Number(i.total),
          quantity: Number(i.quantity),
        }))
      : [];

      setBillItems(normalized);
    } catch (err) {
      toast.error("Failed to load bill items");
    }
  };

  // -------------------------------------------------------
  // GET STOCK FOR DROPDOWNS
  // -------------------------------------------------------
  const loadStock = async () => {
    const res = await fetch("http://localhost:5000/api/stock");
    const data = await res.json();
    setStockList(data);
  };

  // -------------------------------------------------------
  // LOAD INITIAL DATA
  // -------------------------------------------------------
  useEffect(() => {
    loadStock();
    loadBill();
    loadBillItems();
  }, []);

  // Filter descriptions for selected GSM
  useEffect(() => {
    const filtered = stockList.filter((item) => String(item.gsm_number) === selectedGSM);
    setAvailableDescriptions(filtered);
  }, [selectedGSM]);

  // -------------------------------------------------------
  // ADD ITEM
  // -------------------------------------------------------
  const addItem = () => {
    if (!selectedGSM || !selectedDescription) {
      toast.error("Select GSM and Description");
      return;
    }

    const stock = availableDescriptions.find((s) => s.description === selectedDescription);
    if (!stock) return;

    const finalPrice = price === "" ? stock.selling_price : Number(price);
    const newItem: BillItem = {
      id: Math.random(),
      bill_id: Number(id),
      gsm_number: selectedGSM,
      description: selectedDescription,
      quantity,
      price: finalPrice,
      total: finalPrice * quantity,
    };

    setBillItems([...billItems, newItem]);

    setSelectedDescription("");
    setQuantity(1);
    setPrice("");
  };

  const updateItem = (index: number, field: "quantity" | "price" | "gsm_number" | "description", value: string | number) => {
    const updated = [...billItems];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // Recalculate total if quantity or price changes
    updated[index].total =
      Number(updated[index].quantity) * Number(updated[index].price);

    setBillItems(updated);
  };

  // -------------------------------------------------------
  // SAVE EDITED BILL
  // -------------------------------------------------------
  const saveChanges = async () => {
    try {
      // 1. Update bill table
      await fetch(`http://localhost:5000/api/billing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          bill_date: billDate,
          payment_mode: paymentMode,
          status,
          subtotal,
        }),
      });

      // 2. Update bill items
      await fetch(`http://localhost:5000/api/billing/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billItems),
      });

      toast.success("Bill updated successfully!");
      navigate("/billing");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bill");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Bill</h1>
        <Button variant="destructive" onClick={() => navigate("/billing")}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>

      {/* Bill Number */}
      <Input value={billNumber} readOnly className="bg-gray-100" />

      {/* Customer */}
      <Input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Customer Name"
      />

      {/* Date */}
      <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />

      {/* Payment */}
      <div className="flex gap-4">
        <select
          className="border p-2 rounded"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option value=""> Select Payment Mode</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
        </select>

        <select
          className="border p-2 rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Pending">New Invoice</option>
        </select>
      </div>

      {/* Add Items */}
      <div className="flex gap-3 items-center">
        {/* GSM */}
        <select
          className="border p-2 rounded w-48"
          value={selectedGSM}
          onChange={(e) => setSelectedGSM(e.target.value)}
        >
          <option value="">Select GSM</option>
          {Array.from(new Set(stockList.map((s) => s.gsm_number))).map((gsm) => (
            <option key={gsm} value={gsm}>
              {gsm}
            </option>
          ))}
        </select>

        {/* Description */}
        <select
          className="border p-2 rounded w-64"
          value={selectedDescription}
          onChange={(e) => setSelectedDescription(e.target.value)}
        >
          <option value="">Select Description</option>
          {availableDescriptions.map((d) => (
            <option key={d.id} value={d.description}>
              {d.description}
            </option>
          ))}
        </select>

        {/* Qty */}
        <Input
          type="number"
          className="w-20"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        {/* Price */}
        <Input
          type="number"
          className="w-32"
          value={price}
          onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
          placeholder="Price"
        />

        <Button onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Items Table */}
      <table className="w-full border rounded">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2">GSM</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {billItems.map((item, index) => {
            const filteredDescriptions = stockList.filter(
              s => String(s.gsm_number) === String(item.gsm_number)
            );

            return (
              <tr key={item.id} className="border-b">

              {/* ✅ EDITABLE GSM */}
              <td>
                <select
                  className="border rounded p-1"
                  value={item.gsm_number}
                  onChange={(e) =>
                    updateItem(index, "gsm_number", e.target.value)
                  }
                >
                  {Array.from(new Set(stockList.map(s => s.gsm_number))).map(gsm => (
                    <option key={gsm} value={gsm}>{gsm}</option>
                  ))}
                </select>
              </td>

              {/* ✅ EDITABLE DESCRIPTION */}
              <td>
                <select
                  className="border rounded p-1 w-48"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                >
                  {filteredDescriptions.map(desc => (
                    <option key={desc.id} value={desc.description}>
                      {desc.description}
                    </option>
                  ))}
                </select>
              </td>

              {/* EDITABLE QUANTITY */}
              <td>
                <input
                  type="number"
                 min={1}
                 className="border rounded w-20 p-1"
                 value={item.quantity}
                 onChange={(e) =>
                   updateItem(index, "quantity", Number(e.target.value))
                  }
                />
              </td>

              {/* EDITABLE PRICE */}
              <td>
                <input
                  type="number"
                  min={0}
                  className="border rounded w-28 p-1"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(index, "price", Number(e.target.value))
                  }
                />
              </td>

              {/* AUTO TOTAL */}
              <td>₹{Number(item.total || 0).toFixed(2)}</td>
            </tr>
            );
          })}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold">Total: ₹{subtotal.toFixed(2)}</h2>

      <div className="flex gap-3">
        <Button
          className="bg-blue-600 text-white"
          onClick={() =>
            printBillInvoice({
              billNumber: billNumber || "",
              customerName,
              billDate,
              paymentMode,
              items: billItems.map((it) => ({
                gsm_number: it.gsm_number,
                description: it.description,
                quantity: Number(it.quantity),
                price: Number(it.price),
                total: Number(it.total),
              })),
              subtotal: Number(subtotal),
              status, 
            })
          }
        >
          <Printer className="w-4 h-4 mr-1" /> Print Invoice
        </Button>

        <Button onClick={saveChanges} className="bg-green-600 text-white">
          <Save className="w-4 h-4 mr-1" /> Save Changes
        </Button>
      </div>
    </div>
  );
};

export default BillingEdit;
