// src/pages/BillingView.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

interface BillItem {
  id: string;
  gsm_number: string;
  quantity: number;
  price: number;
  total: number;
}

const BillingView = () => {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBillDetails = async () => {
      setLoading(true);

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .single();

      if (billError) {
        toast.error("Bill not found!");
        setLoading(false);
        return;
      }

      setBill(billData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("bill_items")
        .select("*")
        .eq("bill_id", id);

      if (itemsError) toast.error("Failed to fetch bill items");
      else setItems(itemsData || []);

      setLoading(false);
    };

    if (id) fetchBillDetails();
  }, [id]);

  // ✅ Print Invoice Function
  const handlePrint = () => {
    if (!bill || items.length === 0) {
      toast.error("No data to print.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = items
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
          <title>Invoice - ${bill.bill_number}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; color: #000; }
            h2, h3, p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 6px; }
            th { background: #f0f0f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;">Fresh Soft Tissue Enterprises</h2>
          <p style="text-align:center;">All Kind of Engine & Suspension Items</p>

          <hr style="margin: 10px 0;" />

          <p><strong>Invoice #:</strong> ${bill.bill_number}</p>
          <p><strong>Customer:</strong> ${bill.customer_name}</p>
          <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>

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

          <div class="text-right" style="margin-top:10px;">
            <p><strong>Net Total: ₹${bill.total_amount.toFixed(2)}</strong></p>
          </div>

          <hr />
          <p style="text-align:center; font-size:12px; margin-top:20px;">
            Shuwaikh Industrial Area, Opp. Garage Noor
          </p>

          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading bill details...</p>;

  if (!bill)
    return (
      <div className="text-center mt-10">
        <p className="text-gray-500">Bill not found</p>
        <Button onClick={() => navigate("/billing")} className="mt-3">
          ← Back to Billing
        </Button>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧾 Bill Details</h1>
        <div className="flex gap-3">
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            🖨 Print Invoice
          </Button>
          <Button onClick={() => navigate("/billing")} variant="secondary">
            ← Back
          </Button>
        </div>
      </div>

      {/* Bill Header */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <p><strong>Bill No:</strong> {bill.bill_number}</p>
        <p><strong>Customer:</strong> {bill.customer_name}</p>
        <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
        <p><strong>Total:</strong> ₹{bill.total_amount.toFixed(2)}</p>
      </div>

      {/* Bill Items */}
      <div ref={printRef} className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Items</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No items found for this bill.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left p-2">GSM Number</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
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
    </div>
  );
};

export default BillingView;
