import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getStock } from "@/api/stock";
import { printBillInvoice } from "@/lib/BillingPrint";
import { DialogHeader,Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// ⭐ Full Country Calling Code List (ALL COUNTRIES)
export const countryCodes = [
  { code: "+93", country: "Afghanistan" },
  { code: "+355", country: "Albania" },
  { code: "+213", country: "Algeria" },
  { code: "+1-684", country: "American Samoa" },
  { code: "+376", country: "Andorra" },
  { code: "+244", country: "Angola" },
  { code: "+1-264", country: "Anguilla" },
  { code: "+672", country: "Antarctica" },
  { code: "+1-268", country: "Antigua and Barbuda" },
  { code: "+54", country: "Argentina" },
  { code: "+374", country: "Armenia" },
  { code: "+297", country: "Aruba" },
  { code: "+61", country: "Australia" },
  { code: "+43", country: "Austria" },
  { code: "+994", country: "Azerbaijan" },

  { code: "+1-242", country: "Bahamas" },
  { code: "+973", country: "Bahrain" },
  { code: "+880", country: "Bangladesh" },
  { code: "+1-246", country: "Barbados" },
  { code: "+375", country: "Belarus" },
  { code: "+32", country: "Belgium" },
  { code: "+501", country: "Belize" },
  { code: "+229", country: "Benin" },
  { code: "+1-441", country: "Bermuda" },
  { code: "+975", country: "Bhutan" },
  { code: "+591", country: "Bolivia" },
  { code: "+387", country: "Bosnia and Herzegovina" },
  { code: "+267", country: "Botswana" },
  { code: "+55", country: "Brazil" },
  { code: "+246", country: "British Indian Ocean Territory" },
  { code: "+1-284", country: "British Virgin Islands" },
  { code: "+673", country: "Brunei" },
  { code: "+359", country: "Bulgaria" },
  { code: "+226", country: "Burkina Faso" },
  { code: "+257", country: "Burundi" },

  { code: "+855", country: "Cambodia" },
  { code: "+237", country: "Cameroon" },
  { code: "+1", country: "Canada" },
  { code: "+238", country: "Cape Verde" },
  { code: "+1-345", country: "Cayman Islands" },
  { code: "+236", country: "Central African Republic" },
  { code: "+235", country: "Chad" },
  { code: "+56", country: "Chile" },
  { code: "+86", country: "China" },
  { code: "+61", country: "Christmas Island" },
  { code: "+61", country: "Cocos Islands" },
  { code: "+57", country: "Colombia" },
  { code: "+269", country: "Comoros" },
  { code: "+682", country: "Cook Islands" },
  { code: "+506", country: "Costa Rica" },
  { code: "+385", country: "Croatia" },
  { code: "+53", country: "Cuba" },
  { code: "+599", country: "Curacao" },
  { code: "+357", country: "Cyprus" },
  { code: "+420", country: "Czech Republic" },

  { code: "+243", country: "Democratic Republic of the Congo" },
  { code: "+45", country: "Denmark" },
  { code: "+253", country: "Djibouti" },
  { code: "+1-767", country: "Dominica" },
  { code: "+1-809", country: "Dominican Republic" },

  { code: "+670", country: "East Timor" },
  { code: "+593", country: "Ecuador" },
  { code: "+20", country: "Egypt" },
  { code: "+503", country: "El Salvador" },
  { code: "+240", country: "Equatorial Guinea" },
  { code: "+291", country: "Eritrea" },
  { code: "+372", country: "Estonia" },
  { code: "+251", country: "Ethiopia" },

  { code: "+500", country: "Falkland Islands" },
  { code: "+298", country: "Faroe Islands" },
  { code: "+679", country: "Fiji" },
  { code: "+358", country: "Finland" },
  { code: "+33", country: "France" },
  { code: "+689", country: "French Polynesia" },

  { code: "+241", country: "Gabon" },
  { code: "+220", country: "Gambia" },
  { code: "+995", country: "Georgia" },
  { code: "+49", country: "Germany" },
  { code: "+233", country: "Ghana" },
  { code: "+350", country: "Gibraltar" },
  { code: "+30", country: "Greece" },
  { code: "+299", country: "Greenland" },
  { code: "+1-473", country: "Grenada" },
  { code: "+1-671", country: "Guam" },
  { code: "+502", country: "Guatemala" },
  { code: "+44-1481", country: "Guernsey" },
  { code: "+224", country: "Guinea" },
  { code: "+245", country: "Guinea-Bissau" },
  { code: "+592", country: "Guyana" },

  { code: "+509", country: "Haiti" },
  { code: "+504", country: "Honduras" },
  { code: "+852", country: "Hong Kong" },
  { code: "+36", country: "Hungary" },

  { code: "+354", country: "Iceland" },
  { code: "+91", country: "India" },
  { code: "+62", country: "Indonesia" },
  { code: "+98", country: "Iran" },
  { code: "+964", country: "Iraq" },
  { code: "+353", country: "Ireland" },
  { code: "+44-1624", country: "Isle of Man" },
  { code: "+972", country: "Israel" },
  { code: "+39", country: "Italy" },

  { code: "+225", country: "Ivory Coast" },
  { code: "+1-876", country: "Jamaica" },
  { code: "+81", country: "Japan" },
  { code: "+44-1534", country: "Jersey" },
  { code: "+962", country: "Jordan" },

  { code: "+7", country: "Kazakhstan" },
  { code: "+254", country: "Kenya" },
  { code: "+686", country: "Kiribati" },
  { code: "+383", country: "Kosovo" },
  { code: "+965", country: "Kuwait" },
  { code: "+996", country: "Kyrgyzstan" },

  { code: "+856", country: "Laos" },
  { code: "+371", country: "Latvia" },
  { code: "+961", country: "Lebanon" },
  { code: "+266", country: "Lesotho" },
  { code: "+231", country: "Liberia" },
  { code: "+218", country: "Libya" },
  { code: "+423", country: "Liechtenstein" },
  { code: "+370", country: "Lithuania" },
  { code: "+352", country: "Luxembourg" },

  { code: "+853", country: "Macau" },
  { code: "+389", country: "Macedonia" },
  { code: "+261", country: "Madagascar" },
  { code: "+265", country: "Malawi" },
  { code: "+60", country: "Malaysia" },
  { code: "+960", country: "Maldives" },
  { code: "+223", country: "Mali" },
  { code: "+356", country: "Malta" },
  { code: "+692", country: "Marshall Islands" },
  { code: "+222", country: "Mauritania" },
  { code: "+230", country: "Mauritius" },
  { code: "+262", country: "Mayotte" },

  { code: "+52", country: "Mexico" },
  { code: "+691", country: "Micronesia" },
  { code: "+373", country: "Moldova" },
  { code: "+377", country: "Monaco" },
  { code: "+976", country: "Mongolia" },
  { code: "+382", country: "Montenegro" },
  { code: "+1-664", country: "Montserrat" },
  { code: "+212", country: "Morocco" },
  { code: "+258", country: "Mozambique" },
  { code: "+95", country: "Myanmar" },

  { code: "+264", country: "Namibia" },
  { code: "+674", country: "Nauru" },
  { code: "+977", country: "Nepal" },
  { code: "+31", country: "Netherlands" },
  { code: "+599", country: "Netherlands Antilles" },
  { code: "+687", country: "New Caledonia" },
  { code: "+64", country: "New Zealand" },
  { code: "+505", country: "Nicaragua" },
  { code: "+227", country: "Niger" },
  { code: "+234", country: "Nigeria" },
  { code: "+683", country: "Niue" },
  { code: "+850", country: "North Korea" },
  { code: "+1-670", country: "Northern Mariana Islands" },
  { code: "+47", country: "Norway" },

  { code: "+968", country: "Oman" },

  { code: "+92", country: "Pakistan" },
  { code: "+680", country: "Palau" },
  { code: "+970", country: "Palestine" },
  { code: "+507", country: "Panama" },
  { code: "+675", country: "Papua New Guinea" },
  { code: "+595", country: "Paraguay" },
  { code: "+51", country: "Peru" },
  { code: "+63", country: "Philippines" },
  { code: "+64", country: "Pitcairn" },
  { code: "+48", country: "Poland" },
  { code: "+351", country: "Portugal" },
  { code: "+1-787", country: "Puerto Rico" },

  { code: "+974", country: "Qatar" },

  { code: "+242", country: "Republic of the Congo" },
  { code: "+262", country: "Reunion" },
  { code: "+40", country: "Romania" },
  { code: "+7", country: "Russia" },
  { code: "+250", country: "Rwanda" },

  { code: "+590", country: "Saint Barthelemy" },
  { code: "+290", country: "Saint Helena" },
  { code: "+1-869", country: "Saint Kitts and Nevis" },
  { code: "+1-758", country: "Saint Lucia" },
  { code: "+590", country: "Saint Martin" },
  { code: "+508", country: "Saint Pierre and Miquelon" },
  { code: "+1-784", country: "Saint Vincent and the Grenadines" },
  { code: "+685", country: "Samoa" },
  { code: "+378", country: "San Marino" },
  { code: "+239", country: "Sao Tome and Principe" },

  { code: "+966", country: "Saudi Arabia" },
  { code: "+221", country: "Senegal" },
  { code: "+381", country: "Serbia" },
  { code: "+248", country: "Seychelles" },
  { code: "+232", country: "Sierra Leone" },
  { code: "+65", country: "Singapore" },
  { code: "+1-721", country: "Sint Maarten" },
  { code: "+421", country: "Slovakia" },
  { code: "+386", country: "Slovenia" },
  { code: "+677", country: "Solomon Islands" },
  { code: "+252", country: "Somalia" },
  { code: "+27", country: "South Africa" },
  { code: "+82", country: "South Korea" },
  { code: "+211", country: "South Sudan" },
  { code: "+34", country: "Spain" },
  { code: "+94", country: "Sri Lanka" },
  { code: "+249", country: "Sudan" },
  { code: "+597", country: "Suriname" },
  { code: "+47", country: "Svalbard and Jan Mayen" },
  { code: "+268", country: "Swaziland" },
  { code: "+46", country: "Sweden" },
  { code: "+41", country: "Switzerland" },
  { code: "+963", country: "Syria" },

  { code: "+886", country: "Taiwan" },
  { code: "+992", country: "Tajikistan" },
  { code: "+255", country: "Tanzania" },
  { code: "+66", country: "Thailand" },
  { code: "+228", country: "Togo" },
  { code: "+690", country: "Tokelau" },
  { code: "+676", country: "Tonga" },
  { code: "+1-868", country: "Trinidad and Tobago" },
  { code: "+216", country: "Tunisia" },
  { code: "+90", country: "Turkey" },
  { code: "+993", country: "Turkmenistan" },
  { code: "+1-649", country: "Turks and Caicos Islands" },
  { code: "+688", country: "Tuvalu" },

  { code: "+1-340", country: "U.S. Virgin Islands" },
  { code: "+256", country: "Uganda" },
  { code: "+380", country: "Ukraine" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+44", country: "United Kingdom" },
  { code: "+1", country: "United States" },
  { code: "+598", country: "Uruguay" },
  { code: "+998", country: "Uzbekistan" },

  { code: "+678", country: "Vanuatu" },
  { code: "+379", country: "Vatican" },
  { code: "+58", country: "Venezuela" },
  { code: "+84", country: "Vietnam" },
  { code: "+681", country: "Wallis and Futuna" },
  { code: "+212", country: "Western Sahara" },
  { code: "+967", country: "Yemen" },
  { code: "+260", country: "Zambia" },
  { code: "+263", country: "Zimbabwe" }
];

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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [countryCode, setCountryCode] = useState("+91");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [showGSTPopup, setShowGSTPopup] = useState(false);
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

  // ⭐ AUTO-FILL PHONE NUMBER WHEN CUSTOMER NAME IS SELECTED
  useEffect(() => {
    if (!customerName) return;

    async function fetchPhone() {
      try {
        const res = await fetch(`http://localhost:5000/api/billing/phone/${customerName}`);
        const data = await res.json();

        if (data.phone_number) {
          setPhoneNumber(data.phone_number); // Auto-fill
        } else {
          setPhoneNumber(""); // No saved phone → clear field
        }
      } catch (err) {
        console.error("Phone fetch error", err);
      }
    }
    
    fetchPhone();
  }, [customerName]);

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
      phone_number: phoneNumber,
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

  const handlePrint = (withGST: boolean) => {
    printBillInvoice({
      billNumber: savedBillNumber ?? "",
      customerName,
      phoneNumber,        // Add this line
      billDate,
      paymentMode,
      items: billItems,
      subtotal: Number(subtotal),
      status,
      gst: withGST, // Send GST flag
    });
  };

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
            setCustomerName(e.target.value);
            setShowSuggestions(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              setShowSuggestions(false);
              return;
            }

            const filtered = customerNames.filter((n) =>
              n.toLowerCase().includes(customerName.toLowerCase())
            );

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((prev) =>
                prev < filtered.length - 1 ? prev + 1 : prev
              );
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
            }

            if (e.key === "Enter") {
              e.preventDefault();
              if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                setCustomerName(filtered[highlightIndex]);
                setShowSuggestions(false);
              }
            }

            if (e.key === "Escape") {
              setShowSuggestions(false);
            }
          }}
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
                  onClick={async () => {
                    setCustomerName(name);
                    setShowSuggestions(false);

                    const res = await fetch(`http://localhost:5000/api/billing/phone/${name}`);
                    const data = await res.json();
                    setPhoneNumber(data.phone_number || "");
                  }}
                  className={
                    "px-3 py-2 cursor-pointer " +
                    (highlightIndex === index
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100")
                  }
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

      <div className="flex gap-3 max-w-md">
        {/* Country Code Dropdown */}
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="border p-2 rounded-xl w-32"
        >
          {countryCodes.map((c, idx) => (
            <option key={idx} value={c.code}>
              {c.code} ({c.country})
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <Input
          placeholder="Phone Number"
          value={phoneNumber}
          maxLength={10}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, ""); // allow digits only
            if (v.length <= 10) setPhoneNumber(v);
          }}
          className="max-w-full"
        />
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
            onClick={() => setShowGSTPopup(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Bill
          </Button>
          <Button onClick={saveBill} className="bg-green-600 hover:bg-green-700" disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Bill"}</Button>
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