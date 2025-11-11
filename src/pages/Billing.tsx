import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, X, Trash2, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import "./billing-print.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface SparePart {
  id: string;
  part_number: string;
  part_name: string;
  selling_price: number;
  stock_quantity: number;
  unit: string;
}

interface BillItem extends SparePart {
  quantity: number;
  custom_price: number;
  total: number;
}

interface SavedBill {
  id: string;
  bill_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

const Billing = () => {
  const [showBillForm, setShowBillForm] = useState(false);
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [parts, setParts] = useState<SparePart[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<SavedBill | null>(null);
  const [billDetails, setBillDetails] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const printRef = useRef<HTMLDivElement>(null); // for Generate Bill
  const printModalRef = useRef<HTMLDivElement>(null); // for Preview Invoice

  const viewBillDetails = async (billId: string) => {
  try {
    toast.loading("Loading bill details...");

    // Fetch the selected bill
    const selected = savedBills.find((b) => b.id === billId);
    if (!selected) {
      toast.error("Bill not found!");
      return;
    }

    // Fetch bill items from Supabase
    const { data: items, error } = await supabase
      .from("bill_items")
      .select("*")
      .eq("bill_id", billId);

    if (error) throw error;

    console.log("🧾 Bill items fetched:", items);

    // ✅ Update states
    setSelectedBill(selected);
    setBillDetails(items || []);
    setShowPreviewModal(true);

    toast.dismiss();
  } catch (err) {
    toast.dismiss();
    console.error("❌ Error loading bill details:", err);
    toast.error("Failed to load bill details.");
  }
};

  // ✅ Reliable manual print method (works across browsers)
  const handlePrint = (
  ref: React.RefObject<HTMLDivElement>,
  billNumber?: string
) => {
  try {
    // ✅ Use billDetails for preview modal or billItems for generate bill
    const itemsToPrint = billDetails.length > 0 ? billDetails : billItems;
    const currentBill = selectedBill || {
      bill_number: billNumber || "N/A",
      customer_name: customerName || "N/A",
      total_amount: subtotal,
      created_at: billDate || new Date().toISOString(),
    };

    if (!ref.current || itemsToPrint.length === 0) {
      toast.error("No items to print");
      return;
    }

     const toastId = toast.loading("Preparing invoice for print...");
     
    // Create a hidden iframe for printing
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      toast.error("Unable to access print window.");
      return;
    }

    // ✅ Build rows dynamically based on available items
    const rows = itemsToPrint
      .map(
        (item: any, index: number) => `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="text-align:center;">${item.part_number}</td>
            <td>${item.part_name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹${(
              item.selling_price || item.custom_price || 0
            ).toFixed(2)}</td>
            <td style="text-align:right;">₹${(item.total || 0).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    // ✅ Compose print-ready HTML
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice_${currentBill.bill_number}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 10mm;
            }
            .header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .sub-header {
              text-align: center;
              font-size: 11px;
              margin-bottom: 10px;
            }
            .info {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px;
              vertical-align: top;
            }
            th {
              background: #f8f8f8;
              text-align: center;
            }
            .footer {
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .address {
              text-align: center;
              font-size: 11px;
              margin-top: 5mm;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">AL-SHAMALI INTL. CO. AUTO PARTS CENTER</div>
          <div class="sub-header">EZZY STORE — All Kind of Engine & Suspension Items</div>

          <div class="info">
            <div>
              Invoice #: ${currentBill.bill_number}<br>
              Messers: ${currentBill.customer_name}
            </div>
            <div style="text-align:right;">
              Branch: Main<br>
              Date: ${new Date(currentBill.created_at).toLocaleString()}
            </div>
          </div>

          <div style="text-align:center; margin:6px 0;">
            <button style="border:1px solid #000; background:#fff; padding:2px 10px; font-size:11px;">CREDIT INVOICE</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>U-Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="text-align:right; margin-top:10px;">
            <p>Subtotal: ₹${currentBill.total_amount.toFixed(2)}</p>
            <p>Discount: ₹0.00</p>
            <p><strong>Net Amount: ₹${currentBill.total_amount.toFixed(2)}</strong></p>
          </div>

          <div class="footer">
            <p>Receiver ___________________</p>
            <p>Signature ___________________</p>
          </div>

          <div class="address">
            Shuwaikh Industrial Area, Opp. Garage Noor
          </div>
        </body>
      </html>
    `);
    doc.close();

    // ✅ Print trigger
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      document.body.removeChild(printFrame);
      toast.dismiss(toastId); // ✅ Close the loading toast after print
    }, 600);
  } catch (err) {
    console.error("Print error:", err);
    toast.error("🧾 Unable to print invoice.");
  }
};


  useEffect(() => {
  const handleSidebarClick = () => {
    console.log("Sidebar Billing clicked — resetting form");
    setShowBillForm(false);
  };

  window.addEventListener("billing-navigation", handleSidebarClick);

  return () => {
    window.removeEventListener("billing-navigation", handleSidebarClick);
  };
}, []);


  useEffect(() => {
    fetchParts();
    fetchSavedBills();
  }, []);

  const fetchParts = async () => {
    const { data, error } = await supabase.from("spare_parts").select("*");
    if (error) toast.error("Failed to load parts");
    else setParts(data || []);
  };

  const fetchSavedBills = async () => {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load saved bills");
    else setSavedBills(data || []);
  };

  const startNewBill = () => {
    setBillNumber("INV-" + Date.now().toString().slice(-6));
    setBillDate(new Date().toLocaleString());
    setCustomerName("");
    setBillItems([]);
    setShowBillForm(true);
  };

  const cancelBill = () => {
    setShowBillForm(false);
    setSelectedPart(null);
    setQuantity(1);
    setCustomPrice("");
  };

  const addItem = () => {
    if (!selectedPart) {
      toast.error("Please select a part");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error("Enter valid quantity");
      return;
    }

    const price =
      customPrice && customPrice > 0
        ? Number(customPrice)
        : selectedPart.selling_price;

    const existing = billItems.find((i) => i.id === selectedPart.id);
    if (existing) {
      toast.error("This item is already in the bill");
      return;
    }

    const newItem: BillItem = {
      ...selectedPart,
      quantity,
      custom_price: price,
      total: quantity * price,
    };

    setBillItems([...billItems, newItem]);
    setSelectedPart(null);
    setQuantity(1);
    setCustomPrice("");
  };

  const removeItem = (id: string) => {
    setBillItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = billItems.reduce((sum, i) => sum + i.total, 0);

  const saveBill = async () => {
  if (billItems.length === 0) {
    toast.error("Add at least one item before saving the bill");
    return;
  }

  try {
    toast.loading("Saving bill...");

    // ✅ Step 1: Save the main bill record
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

    if (billError || !billData) {
      throw billError || new Error("Failed to create bill record");
    }

    console.log("🧾 Bill created:", billData);

    // ✅ Step 2: Prepare items linked to this bill ID
    const itemsData = billItems.map((item) => ({
  bill_id: billData.id,
  part_number: item.part_number,
  part_name: item.part_name,
  quantity: item.quantity,
  total: item.total,
  selling_price: Number(item.custom_price) || Number(item.selling_price) || 0, // ✅ FIXED
}));

    console.log("🧩 Bill items to insert:", itemsData);

    // ✅ Step 3: Insert all related bill items
    const { error: itemsError } = await supabase
      .from("bill_items")
      .insert(itemsData);

    if (itemsError) {
  console.error("⚠️ Bill items insert error:", itemsError);
  throw itemsError;
}

    toast.dismiss();
    toast.success("✅ Bill and items saved successfully!");

    // ✅ Step 4: Reset UI + reload saved bills
    setShowBillForm(false);
    fetchSavedBills();
  } catch (err: any) {
  console.error("❌ Error saving bill:", err);
  if (err?.message) toast.error(err.message);
  else toast.error("Error saving bill. Please try again.");
  toast.dismiss();
}
};


  const deleteBill = async (billId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this bill?"
    );
    if (!confirmDelete) return;

    try {
      const { error: itemsError } = await supabase
        .from("bill_items")
        .delete()
        .eq("bill_id", billId);

      if (itemsError) throw itemsError;

      const { error: billError } = await supabase
        .from("bills")
        .delete()
        .eq("id", billId);

      if (billError) throw billError;

      toast.success("🗑️ Bill deleted successfully!");
      fetchSavedBills();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting bill.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        🧾 Billing Section
      </h1>

      {!showBillForm ? (
        <>
          <div className="flex justify-center items-center h-40">
            <Button
              onClick={startNewBill}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-lg shadow-md"
            >
              + Add New Bill
            </Button>
          </div>

          {savedBills.length > 0 && (
            <div className="border rounded-lg p-4 bg-white shadow-sm mt-6">
              <h2 className="text-xl font-semibold mb-3">Saved Bills</h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Bill No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => viewBillDetails(bill.id)}
                          >
                            {bill.bill_number}
                          </button>
                      </TableCell>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell>
                        {new Date(bill.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBill(bill.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Generate Bill</h2>
                <p className="text-gray-500 text-sm">
                  Bill No: <span className="font-medium">{billNumber}</span> | Date:{" "}
                  <span>{billDate}</span>
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={cancelBill}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>

            <Input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="max-w-md"
            />

            {/* Select Parts */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                className="border rounded-md p-2 w-64"
                value={selectedPart ? String(selectedPart.id) : ""}
                onChange={(e) => {
                  const part = parts.find((p) => String(p.id) === e.target.value);
                  setSelectedPart(part || null);
                }}
              >
                <option value="">Select Part...</option>
                {parts.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.part_number} - {p.part_name}
                  </option>
                ))}
              </select>

              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-32"
                placeholder="Qty"
              />

              <Input
                type="number"
                min={0}
                value={customPrice}
                onChange={(e) =>
                  setCustomPrice(e.target.value ? Number(e.target.value) : "")
                }
                className="w-40"
                placeholder="Custom Price"
              />

              <Button onClick={addItem} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            {/* ✅ Printable Invoice Section */}
            <div ref={printRef} className="mt-6 border p-6 text-sm font-mono">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold uppercase">
                  AL-SHAMALI INTL. CO. AUTO PARTS CENTER
                </h2>
                <p className="text-xs">
                  EZZY STORE — All Kind of Engine & Suspension Items
                </p>
                <h3 className="mt-2 border w-fit px-3 py-1 mx-auto text-sm">
                  CREDIT INVOICE
                </h3>
              </div>

              <div className="flex justify-between text-xs mb-3">
                <div>
                  Invoice #: {billNumber} <br />
                  Messers: {customerName || "N/A"}
                </div>
                <div className="text-right">
                  Date: {billDate}
                  <br />
                  Branch: Main
                </div>
              </div>

              <table className="w-full border-collapse border text-xs mb-3">
                <thead>
                  <tr className="border">
                    <th className="border p-1 w-10">S.No</th>
                    <th className="border p-1 w-24">Part No</th>
                    <th className="border p-1">Description</th>
                    <th className="border p-1 w-24">Brand</th>
                    <th className="border p-1 w-12">Qty</th>
                    <th className="border p-1 w-20">U-Price</th>
                    <th className="border p-1 w-20">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border p-1 text-center">{index + 1}</td>
                      <td className="border p-1 text-center">{item.part_number}</td>
                      <td className="border p-1">{item.part_name}</td>
                      <td className="border p-1 text-center">-</td>
                      <td className="border p-1 text-center">{item.quantity}</td>
                      <td className="border p-1 text-right">
                        ₹{item.custom_price.toFixed(2)}
                      </td>
                      <td className="border p-1 text-right">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right text-sm mt-4">
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Discount: ₹0.00</p>
                <p className="font-semibold">Net Amount: ₹{subtotal.toFixed(2)}</p>
              </div>

              <div className="flex justify-between text-xs mt-6 pt-4 border-t">
                <p>Receiver ___________________</p>
                <p>Signature ___________________</p>
              </div>
            </div>

            {/* ✅ Save + Print Actions */}
            {billItems.length > 0 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-lg font-semibold">
                  Total: ₹{subtotal.toFixed(2)}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={saveBill}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Bill
                  </Button>
                  <Button
                    onClick={() => handlePrint(printRef, billNumber)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print Invoice
                  </Button>
                </div>
              </div>
            )}

            {showPreviewModal && selectedBill && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-in-out">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-h-[90vh] overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Invoice Preview — {selectedBill.bill_number}
        </h2>
        <Button
          onClick={() => setShowPreviewModal(false)}
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          Close
        </Button>
      </div>

      {/* Print button */}
      <Button
        onClick={() => {
  setTimeout(() => handlePrint(printModalRef, selectedBill?.bill_number), 300);
}}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        🖨️ Print Invoice
      </Button>

      {/* Preview content */}
      <div ref={printModalRef}>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold uppercase">
            AL-SHAMALI INTL. CO. AUTO PARTS CENTER
          </h2>
          <p className="text-xs">
            EZZY STORE — All Kind of Engine & Suspension Items
          </p>
          <h3 className="mt-2 border w-fit px-3 py-1 mx-auto text-sm">
            CREDIT INVOICE
          </h3>
        </div>

        <div className="flex justify-between text-xs mb-3">
          <div>
            Invoice #: {selectedBill.bill_number} <br />
            Messers: {selectedBill.customer_name}
          </div>
          <div className="text-right">
            Date: {new Date(selectedBill.created_at).toLocaleString()} <br />
            Branch: Main
          </div>
        </div>

        <table className="w-full border-collapse border text-xs mb-3">
          <thead>
            <tr>
              <th className="border p-1">S.No</th>
              <th className="border p-1">Part No</th>
              <th className="border p-1">Description</th>
              <th className="border p-1">Qty</th>
              <th className="border p-1">U-Price</th>
              <th className="border p-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {billDetails && billDetails.length > 0 ? (
              billDetails.map((item, index) => (
                <tr key={item.id}>
                  <td className="border p-1 text-center">{index + 1}</td>
                  <td className="border p-1 text-center">{item.part_number}</td>
                  <td className="border p-1">{item.part_name}</td>
                  <td className="border p-1 text-center">{item.quantity}</td>
                  <td className="border p-1 text-right">₹{item.selling_price}</td>
                  <td className="border p-1 text-right">₹{item.total}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-2">
                  No items found for this bill.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="text-right text-sm mt-4">
          <p>Subtotal: ₹{selectedBill.total_amount.toFixed(2)}</p>
          <p>Discount: ₹0.00</p>
          <p className="font-semibold">
            Net Amount: ₹{selectedBill.total_amount.toFixed(2)}
          </p>
        </div>

        <div className="flex justify-between text-xs mt-6 pt-4 border-t">
          <p>Receiver ___________________</p>
          <p>Signature ___________________</p>
        </div>
      </div>
    </div>
  </div>
)}
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;
