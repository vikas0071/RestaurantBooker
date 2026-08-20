import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, setDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { redeemLicenseKey } from "@/lib/subscription";
import { Crown, Sparkles, Lock, Key, AlertCircle } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  preparationTime?: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isAvailable?: boolean;
}

export default function MenuManagement() {
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [form, setForm] = useState<Partial<MenuItem>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Premium / Subscription State
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const user = auth.currentUser;
  const { toast } = useToast();

  // Listen to Admin profile for real-time Premium status
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(doc(db, "admins", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setIsPremium(!!snapshot.data()?.isPremium);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Table management (Firestore)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "tables"), where("adminId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Firestore tables listener notice:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Menu management (Firestore)
  useEffect(() => {
    if (!user?.uid) return;
    setMenuLoading(true);
    const q = query(collection(db, "menuItems"), where("adminId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
      setMenuLoading(false);
    }, (error) => {
      console.warn("Firestore menuItems listener notice:", error);
      setMenuLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddOrEditMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast({ title: "All fields required", description: "Name, price, and category are required.", variant: "destructive" });
      return;
    }

    // Check Free Plan limit (Max 5 items for free tier)
    if (!editingId && !isPremium && menuItems.length >= 5) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "menuItems", editingId), form);
        toast({ title: "Menu item updated" });
      } else {
        await addDoc(collection(db, "menuItems"), {
          ...form,
          adminId: user?.uid,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Menu item added successfully!" });
      }
      setForm({});
      setEditingId(null);
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err.message || "Failed to save menu item. Check Firestore permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setRedeeming(true);
    const res = await redeemLicenseKey(user.uid, licenseInput);
    setRedeeming(false);
    if (res.success) {
      toast({ title: "🎉 Upgrade Successful!", description: res.message });
      setShowUpgradeModal(false);
      setLicenseInput("");
    } else {
      toast({ title: "Redemption Failed", description: res.message, variant: "destructive" });
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await deleteDoc(doc(db, "menuItems", id));
      toast({ title: "Menu item deleted" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;

    // Check Free Plan limit (Max 5 tables for free tier)
    if (!isPremium && tables.length >= 5) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "tables", tableNumber), {
        adminId: user?.uid,
        tableNumber,
        createdAt: new Date().toISOString(),
      });
      setTableNumber("");
      toast({ title: "Table added successfully" });
    } catch (err: any) {
      toast({
        title: "Failed to add table",
        description: err.message || "Check Firestore permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = (tableNum: string) => {
    const canvas = document.getElementById(`qr-${tableNum}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-${tableNum}-qr.png`;
    link.click();
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!window.confirm("Delete this table and its QR code?")) return;
    try {
      await deleteDoc(doc(db, "tables", tableId));
      toast({ title: "Table deleted" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete table.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;
  return (
    <div className="space-y-8">
      {/* Table Management Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Table & QR Code Management</h2>
            <p className="text-xs text-gray-500">Generate QR codes for your restaurant tables.</p>
          </div>
          <Badge variant="outline" className={`text-xs ${isPremium ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-amber-400 bg-amber-50 text-amber-800"}`}>
            {isPremium ? `UNLIMITED PRO (${tables.length} Tables)` : `Free Limit: 5 Tables (Used: ${tables.length})`}
          </Badge>
        </div>

        <form onSubmit={handleAddTable} className="flex space-x-2 mb-6">
          <input
            type="text"
            placeholder="Table Number or Name (e.g. 5, 12, VIP)"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="border rounded px-3 py-2 text-sm border-gray-300 focus:border-primary"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !tableNumber}>
            {loading ? "Adding..." : "Add Table"}
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id} className="border border-gray-200 bg-gray-50/50 rounded-xl p-4 flex flex-col items-center shadow-xs">
              <div className="mb-2 font-bold text-gray-900">Table: {table.tableNumber}</div>
              <QRCodeCanvas
                id={`qr-${table.tableNumber}`}
                value={`${window.location.origin}/order?table=${encodeURIComponent(table.tableNumber)}`}
                size={128}
                level="H"
                includeMargin
                className="bg-white p-1 rounded-lg border border-gray-200"
              />
              <div className="flex gap-2 mt-3 w-full">
                <Button size="sm" onClick={() => handleDownloadQR(table.tableNumber)} className="flex-1 text-xs">
                  Download QR
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteTable(table.id)} className="text-xs">
                  Delete Table
                </Button>
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 text-sm">
              No tables added yet. Enter a table number above to generate your first QR code!
            </div>
          )}
        </div>
      </div>

      {/* Menu Management Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        {/* Free Plan Banner specifically for Menu Items */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-700 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  Free Tier Plan ({menuItems.length}/5 Menu Items used)
                </p>
                <p className="text-xs text-amber-800">
                  Upgrade to PRO to add unlimited menu items, dishes, and categories!
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowUpgradeModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Unlock PRO Access
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Menu Management</h2>
          <Badge variant="outline" className={`text-xs ${isPremium ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-amber-400 bg-amber-50 text-amber-800"}`}>
            {isPremium ? `UNLIMITED PRO (${menuItems.length} Items)` : `Free Limit: 5 Items (Used: ${menuItems.length})`}
          </Badge>
        </div>

        <form onSubmit={handleAddOrEditMenuItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={form.name || ""}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description || ""}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price || ""}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Category (e.g. appetizers)"
            value={form.category || ""}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="number"
            placeholder="Preparation Time (min)"
            value={form.preparationTime || ""}
            onChange={e => setForm(f => ({ ...f, preparationTime: Number(e.target.value) }))}
            className="border rounded px-3 py-2"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!form.isVegetarian}
              onChange={e => setForm(f => ({ ...f, isVegetarian: e.target.checked }))}
            />
            <span>Vegetarian</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!form.isSpicy}
              onChange={e => setForm(f => ({ ...f, isSpicy: e.target.checked }))}
            />
            <span>Spicy</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isAvailable !== false}
              onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
            />
            <span>Available</span>
          </label>
          <Button type="submit" className="col-span-1 md:col-span-2" disabled={loading}>
            {editingId ? (loading ? "Updating..." : "Update Item") : (loading ? "Adding..." : "Add Item")}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => { setForm({}); setEditingId(null); }}>
              Cancel Edit
            </Button>
          )}
        </form>

        {menuLoading ? (
          <div>Loading menu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="border rounded p-4 flex flex-col">
                <div className="font-medium mb-1">{item.name}</div>
                <div className="text-sm text-gray-600 mb-1">{item.description}</div>
                <div className="mb-1">₹ {item.price}</div>
                <div className="mb-1">Category: {item.category}</div>
                <div className="mb-1">Prep: {item.preparationTime || 15} min</div>
                <div className="mb-1">{item.isVegetarian ? "Veg" : ""} {item.isSpicy ? "Spicy" : ""}</div>
                <div className="mb-1">{item.isAvailable === false ? "Not Available" : "Available"}</div>
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" onClick={() => handleEditMenuItem(item)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteMenuItem(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade to PRO Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <Crown className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Unlock PRO / Premium Features</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm mt-1">
              You have reached the Free Tier limit (5 Tables / 5 Menu Items). Enter your License Key below to upgrade to Unlimited PRO Access!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRedeemKey} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" /> Enter Activation / License Key
              </label>
              <Input
                placeholder="e.g. PRO-2026-VIP"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                className="font-mono text-base uppercase border-amber-300 focus:border-amber-500 h-12"
                required
              />
              <p className="text-xs text-gray-500">
                Don't have a key? Contact the owner/admin or try demo key: <code className="font-bold text-amber-700">PRO-2026-VIP</code>
              </p>
            </div>

            <Button
              type="submit"
              disabled={redeeming}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-lg"
            >
              {redeeming ? "Activating..." : "Activate PRO Plan Now"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}