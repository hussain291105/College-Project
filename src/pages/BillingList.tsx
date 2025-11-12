import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SavedBill {
  id: string;
  bill_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

const BillingList = () => {
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const navigate = useNavigate();

  const fetchSavedBills = async () => {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load saved bills");
    else setSavedBills(data || []);
  };

  const deleteBill = async (billId: string) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;

    try {
      await supabase.from("bill_items").delete().eq("bill_id", billId);
      await supabase.from("bills").delete().eq("id", billId);
      toast.success("🗑️ Bill deleted successfully!");
      fetchSavedBills();
    } catch (err) {
      toast.error("Error deleting bill.");
    }
  };

  useEffect(() => {
    fetchSavedBills();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">🧾 Billing Section</h1>

      {/* Add New Bill */}
      <div className="flex justify-center items-center h-40">
        <Button
          onClick={() => navigate("/billing/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-lg shadow-md"
        >
          + Add New Bill
        </Button>
      </div>

      {/* Saved Bills Table */}
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
      <TableCell className="text-blue-600">
        {bill.bill_number}
      </TableCell>
      <TableCell>{bill.customer_name}</TableCell>
      <TableCell>{new Date(bill.created_at).toLocaleString()}</TableCell>
      <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
      <TableCell className="flex gap-2">
        {/* ✅ View Bill Button */}
        <Button
          size="sm"
          onClick={() => navigate(`/billing/${bill.id}`)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          👁️ View
        </Button>

        {/* 🗑️ Delete Bill */}
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
    </div>
  );
};

export default BillingList;
