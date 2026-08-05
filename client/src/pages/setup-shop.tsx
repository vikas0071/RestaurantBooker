import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Utensils, QrCode, CheckCircle2, Sparkles } from "lucide-react";

export default function SetupShopPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("Multi-Cuisine");
  const [tableCount, setTableCount] = useState<number>(5);
  const [addSampleMenu, setAddSampleMenu] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }
      setCurrentUser(firebaseUser);
      setRestaurantName(firebaseUser.displayName || "");

      // Check if already setup
      try {
        const adminSnap = await getDoc(doc(db, "admins", firebaseUser.uid));
        if (adminSnap.exists() && adminSnap.data().isSetupComplete) {
          navigate("/admin");
          return;
        }
      } catch (e) {
        console.warn("Setup check error:", e);
      } finally {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      toast({
        title: "Shop name required",
        description: "Please enter your restaurant / shop name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const uid = currentUser.uid;

      // 1. Save Admin Shop Profile
      try {
        await setDoc(doc(db, "admins", uid), {
          email: currentUser.email || "",
          restaurantName: restaurantName.trim(),
          cuisineType: cuisineType.trim(),
          isSetupComplete: true,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore admin write notice:", e);
      }

      // 2. Generate Initial Tables if requested
      if (tableCount > 0) {
        for (let i = 1; i <= Math.min(tableCount, 50); i++) {
          try {
            await setDoc(doc(db, "tables", `${i}`), {
              adminId: uid,
              tableNumber: `${i}`,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn(`Failed to set table ${i}:`, e);
          }
        }
      }

      // 3. Add Starter Menu Items if requested
      if (addSampleMenu) {
        const starterItems = [
          { name: "Paneer Butter Masala", price: "320", category: "mains", description: "Rich cottage cheese in tomato butter gravy.", preparationTime: 20, isVegetarian: true, isSpicy: false, isAvailable: true, adminId: uid },
          { name: "Crispy Spring Rolls", price: "180", category: "appetizers", description: "Golden fried vegetable rolls served with dip.", preparationTime: 15, isVegetarian: true, isSpicy: false, isAvailable: true, adminId: uid },
          { name: "Garlic Naan", price: "60", category: "breads", description: "Fresh butter garlic flatbread.", preparationTime: 10, isVegetarian: true, isSpicy: false, isAvailable: true, adminId: uid },
          { name: "Mango Lassi", price: "120", category: "beverages", description: "Sweet chilled mango yogurt drink.", preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, adminId: uid },
          { name: "Gulab Jamun", price: "100", category: "desserts", description: "Rose sugar syrup dumplings.", preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, adminId: uid },
        ];

        for (const item of starterItems) {
          try {
            await addDoc(collection(db, "menuItems"), { ...item, createdAt: new Date().toISOString() });
          } catch (e) {
            console.warn("Failed to add sample item:", e);
          }
        }
      }

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify({
        uid,
        email: currentUser.email,
        restaurantName: restaurantName.trim(),
      }));

      toast({
        title: "Shop setup complete!",
        description: `Welcome to ${restaurantName}! Your tables and menu have been configured.`,
      });

      navigate("/admin");
    } catch (error: any) {
      console.error("Setup shop error:", error);
      toast({
        title: "Setup failed",
        description: error.message || "Failed to set up shop. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-secondary">
            Setup Your Restaurant Shop
          </CardTitle>
          <CardDescription className="text-gray-600 text-base mt-2">
            Configure your shop details, tables, and starter menu to get started.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="text-sm font-semibold flex items-center gap-1.5">
                <Store className="w-4 h-4 text-primary" /> Restaurant / Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="restaurantName"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-12 text-base border-gray-300 focus:border-primary"
                placeholder="e.g. Vikas Bistro, Royal Spice Café"
                required
                disabled={loading}
              />
            </div>

            {/* Cuisine / Category */}
            <div className="space-y-2">
              <Label htmlFor="cuisineType" className="text-sm font-semibold flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-accent" /> Cuisine / Type (Optional)
              </Label>
              <Input
                id="cuisineType"
                type="text"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                className="h-12 text-base border-gray-300"
                placeholder="e.g. North Indian, Fine Dining, Fast Food"
                disabled={loading}
              />
            </div>

            {/* Initial Table Count */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label htmlFor="tableCount" className="text-sm font-semibold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-primary" /> Initial Number of Tables (Optional)
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="tableCount"
                  type="number"
                  min="0"
                  max="50"
                  value={tableCount}
                  onChange={(e) => setTableCount(parseInt(e.target.value) || 0)}
                  className="h-12 w-32 text-center text-base font-semibold border-gray-300"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Automatically generates QR codes for Tables 1 to {tableCount || 0}.
                </p>
              </div>
            </div>

            {/* Starter Menu Checkbox */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addSampleMenu}
                  onChange={(e) => setAddSampleMenu(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  disabled={loading}
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-secondary text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Load Starter Sample Menu
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Adds starter menu items (Starters, Mains, Naan, Drinks & Desserts) so your QR menu is ready immediately.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-13 bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg transition-all duration-200 hover:scale-[1.01]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Your Shop...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Complete Setup & Open Dashboard
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
