import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, setDoc } from "firebase/firestore";
// @ts-ignore
import QRCode from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const user = auth.currentUser;
  const { toast } = useToast();

  // Table management (already Firestore)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "tables"), where("adminId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddOrEditMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast({ title: "All fields required", description: "Name, price, and category are required.", variant: "destructive" });
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
        toast({ title: "Menu item added" });
      }
      setForm({});
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm("Delete this menu item?")) return;
    await deleteDoc(doc(db, "menuItems", id));
    toast({ title: "Menu item deleted" });
  };

  // Table QR code logic unchanged...
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "tables", tableNumber), {
        adminId: user?.uid,
        tableNumber,
        createdAt: new Date().toISOString(),
      });
      setTableNumber("");
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
    await deleteDoc(doc(db, "tables", tableId));
    toast({ title: "Table deleted" });
  };

  if (!user) return null;
  return (
    <div className="space-y-8">
      {/* Table Management */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Table Management</h2>
        <form onSubmit={handleAddTable} className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Table Number or Name"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !tableNumber}>
            {loading ? "Adding..." : "Add Table"}
          </Button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.id} className="border rounded p-4 flex flex-col items-center">
              <div className="mb-2 font-medium">Table: {table.tableNumber}</div>
              <QRCode
                id={`qr-${table.tableNumber}`}
                value={`${window.location.origin}/order?table=${encodeURIComponent(table.tableNumber)}`}
                size={128}
                level="H"
                includeMargin
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleDownloadQR(table.tableNumber)}>
                  Download QR
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteTable(table.id)}>
                  Delete Table
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Menu Management */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Menu Management</h2>
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
    </div>
  );
}