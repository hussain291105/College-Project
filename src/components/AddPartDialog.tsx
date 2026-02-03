import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createStock } from "@/api/stock";

interface AddPartDialogProps {
  onPartAdded: () => void;
}

const AddPartDialog = ({ onPartAdded }: AddPartDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    gsm_number: "",
    category: "",
    description: "",
    manufacturer: "",
    stock: "",
    minimum_stock: "", 
    cost_price: "",
    selling_price: "",
    kg: "",
    amount: "",
    unit: "Packet",
  });

  const resetForm = () => {
    setFormData({
      gsm_number: "",
      category: "",
      description: "",
      manufacturer: "",
      selling_price: "",
      cost_price: "",
      stock: "",
      minimum_stock: "",
      unit: "Packet",
      kg: "",
      amount: "",
    });
  };

  // Auto-calc cost price when KG + amount provided
  useEffect(() => {
    const kg = parseFloat(formData.kg);
    const amount = parseFloat(formData.amount);
    if (kg && amount) {
      const cost = (amount / (kg * 1000)) * 100;
      setFormData((prev) => ({ ...prev, cost_price: cost.toFixed(2) }));
    }
  }, [formData.kg, formData.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newStock = {
        gsm_number: Number(formData.gsm_number),
        category: formData.category.trim(),
        description: formData.description?.trim() || "",
        manufacturer: formData.manufacturer?.trim() || null,
        stock: Number(formData.stock),
        minimum_stock: Number(formData.minimum_stock),
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        kg: formData.kg ? Number(formData.kg) : null,
        amount: formData.amount ? Number(formData.amount) : null, // REQUIRED by SparePart type
        unit: formData.unit || "Packet",
      };

      await createStock(newStock);

      toast.success("Stock item added successfully!");
      onPartAdded();
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to add stock");
      console.error("CREATE STOCK ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm(); 
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Stock
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Stock Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>GSM Number *</Label>
              <Input
                required
                value={formData.gsm_number}
                onChange={(e) =>
                  setFormData({ ...formData, gsm_number: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Category *</Label>
              <select
                className="border rounded-md p-2 w-full"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="">Select Category</option>
                <option value="Soft">Soft</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <select
              className="border rounded-md p-2 w-full"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            >
              <option value="">Select Description</option>
              <option value="Light Green Packet">Light Green Packet</option>
              <option value="Dark Green Packet">Dark Green Packet</option>
            </select>
          </div>

          <div>
            <Label>Manufacturer</Label>
            <Input
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Selling Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Cost Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Stock *</Label>
              <Input
                type="number"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Minimum Stock *</Label>
              <Input
                type="number"
                required
                value={formData.minimum_stock}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_stock: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Unit *</Label>
              <Input
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>  

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>KG</Label>
              <Input
                type="number"
                value={formData.kg}
                onChange={(e) =>
                  setFormData({ ...formData, kg: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
          </div>

          <Button className="bg-green-600 hover:bg-green-700" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPartDialog;
