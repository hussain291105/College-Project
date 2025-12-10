// BillingView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { printBillInvoice } from "@/lib/BillingPrint";
import { PrinterIcon } from "lucide-react";
import { DialogHeader,Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface BillItem {
  id: number;
  gsm_number: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Bill {
  id: number;
  bill_number?: string;
  customer_name?: string;
  phone_number?:string;
  bill_date?: string;
  subtotal?: number;
  payment_mode?: string;
  status?: string;
}

export default function BillingView() {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [showGSTPopup, setShowGSTPopup] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadBill(id);
  }, [id]);

  async function loadBill(billId: string) {
    try {
      // 1) Load bill header
      const billRes = await fetch(`http://localhost:5000/api/billing/${billId}`);
      if (!billRes.ok) {
        const err = await billRes.json();
        toast.error(err?.error || "Failed to load bill");
        return;
      }
      const billData = await billRes.json();

      // 2) Load bill items
      const itemsRes = await fetch(
        `http://localhost:5000/api/billing/${billId}/items`
      );
      const itemsData = await itemsRes.json();

      setBill(billData);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  }

  const handlePrint = (withGST: boolean) => {
    printBillInvoice({
      bill,
      items,
      billNumber: bill?.bill_number ?? `INV-${String(bill?.id ?? "").padStart(4, "0")}`,
      customerName: bill?.customer_name,
      phoneNumber : bill?.phone_number,        // Add this line
      billDate: bill?.bill_date,
      paymentMode: bill?.payment_mode,
      subtotal: bill?.subtotal,
      status: bill?.status,
      gst: withGST, // Send GST flag
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoice {bill ? (bill.bill_number ?? `INV-${String(bill.id).padStart(4,"0")}`) : ""}</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/billing/edit/${id}`)} className="bg-yellow-500 text-white hover:bg-yellow-600">Edit</Button>
          <Button variant="destructive" onClick={() => navigate("/billing")}>
            Back
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p><strong>Customer:</strong> {bill?.customer_name ?? "—"}</p>
        <p><strong>Phone:</strong> {bill?.phone_number ?? "—"}</p>
        <p><strong>Date:</strong> {formatDate(bill?.bill_date)}</p>
        <p><strong>Payment:</strong> {bill?.payment_mode ?? "—"}</p>
        <p><strong>Status:</strong> {bill?.status ?? "—"}</p>
      </div>

      <div className="mt-6 border rounded p-4 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">GSM</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-b">
                <td className="p-2">{it.gsm_number}</td>
                <td className="p-2">{it.description}</td>
                <td className="p-2 text-right">{it.quantity}</td>
                <td className="p-2 text-right">₹{Number(it.price || 0).toFixed(2)}</td>
                <td className="p-2 text-right">₹{Number(it.total || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4">
          <h3 className="text-lg font-bold">
            Total: ₹{Number(bill?.subtotal ?? 0).toFixed(2)}
          </h3>
        </div>
      </div>
        <div className="mt-8 flex justify-end">
          <div className="flex gap-3">
            <Button
              onClick={() => setShowGSTPopup(true)}
              className="bg-blue-600"
            >
              <PrinterIcon className="w-4 h-4 mr-1" /> Print Bill
            </Button>
          </div>
        </div>

        {/* GST Confirmation Popup */}
      <Dialog open={showGSTPopup} onOpenChange={setShowGSTPopup}>
        <DialogContent className="max-w-md p-6 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              Select GST Option
            </DialogTitle>
            <DialogDescription className="text-center">
              Choose how you want to print the invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between gap-4 mt-4">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-lg text-md font-semibold"
              onClick={() => {
                setShowGSTPopup(false);
                handlePrint(true); // WITH GST
              }}
            >
              Print WITH GST
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white w-full py-3 rounded-lg text-md font-semibold"
              onClick={() => {
                setShowGSTPopup(false);
                handlePrint(false); // WITHOUT GST
              }}
            >
              Print WITHOUT GST
            </Button>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full py-3 rounded-lg text-md font-semibold bg-white hover:bg-gray-400"
              onClick={() => setShowGSTPopup(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
