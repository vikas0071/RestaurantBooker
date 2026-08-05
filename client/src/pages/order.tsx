import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MenuItem } from "@shared/schema";
import MenuItemComponent from "@/components/customer/menu-item";
import FloatingCart from "@/components/customer/floating-cart";
import CartModal from "@/components/customer/cart-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Clock, IndianRupee, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

const SAMPLE_MENU: MenuItem[] = [
  {
    id: "sample-1",
    name: "Paneer Butter Masala",
    description: "Rich and creamy dish made with cottage cheese, butter, and tomato gravy.",
    price: "320",
    category: "mains",
    preparationTime: 20,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true,
  },
  {
    id: "sample-2",
    name: "Crispy Spring Rolls",
    description: "Golden fried vegetable spring rolls served with sweet chili sauce.",
    price: "180",
    category: "appetizers",
    preparationTime: 15,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true,
  },
  {
    id: "sample-3",
    name: "Garlic Naan",
    description: "Traditional Indian flatbread flavored with minced garlic and butter.",
    price: "60",
    category: "breads",
    preparationTime: 10,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true,
  },
  {
    id: "sample-4",
    name: "Mango Lassi",
    description: "Refreshing yogurt-based drink blended with sweet mango pulp.",
    price: "120",
    category: "beverages",
    preparationTime: 5,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true,
  },
  {
    id: "sample-5",
    name: "Gulab Jamun",
    description: "Soft milk-solid dumplings soaked in rose-flavored sugar syrup.",
    price: "100",
    category: "desserts",
    preparationTime: 5,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true,
  }
];

export default function OrderPage() {
  const [tableNumber, setTableNumber] = useState<string | number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("appetizers");

  const [shopName, setShopName] = useState<string>("Spice Garden");
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableAdminId, setTableAdminId] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenuAndAdmin() {
      setIsLoading(true);
      setTableError(null);
      const params = new URLSearchParams(window.location.search);
      const rawTable = params.get("table") || "1";
      setTableNumber(rawTable);

      try {
        let adminId: string | null = null;
        try {
          const tableSnap = await getDoc(doc(db, "tables", rawTable));
          if (tableSnap.exists()) {
            adminId = tableSnap.data().adminId;
            if (adminId) {
              const adminSnap = await getDoc(doc(db, "admins", adminId));
              if (adminSnap.exists() && adminSnap.data().restaurantName) {
                setShopName(adminSnap.data().restaurantName);
              }
            }
          }
        } catch (e) {
          console.warn("Firestore table lookup notice:", e);
        }

        let items: MenuItem[] = [];
        try {
          let q;
          if (adminId) {
            q = query(collection(db, "menuItems"), where("adminId", "==", adminId));
          } else {
            q = collection(db, "menuItems");
          }
          const snapshot = await getDocs(q);
          items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        } catch (e) {
          console.warn("Firestore menu query notice:", e);
        }

        if (items.length === 0) {
          items = SAMPLE_MENU;
        }

        setMenuItems(items);
        const firstCat = items[0]?.category || "appetizers";
        setActiveCategory(firstCat);
      } catch (err: any) {
        console.error("Error fetching menu:", err);
        setMenuItems(SAMPLE_MENU);
        setActiveCategory("appetizers");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenuAndAdmin();
  }, []);

  const groupedMenu = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  const categories = Object.keys(groupedMenu);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
      }];
    });
  };

  const updateCartItemQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  if (tableError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="w-full max-w-md mx-4 shadow-xl animate-in fade-in duration-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-secondary mb-2">{tableError}</h1>
              <a 
                href="/" 
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go Back
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 animate-in slide-in-from-top duration-300">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-secondary">{shopName}</h1>
              <p className="text-sm text-gray-600">
                Table <span className="font-medium text-primary">{tableNumber}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Clock className="w-3 h-3 mr-1" />
                Live Menu
              </Badge>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="px-4 py-3">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <Button
                key={category}
                variant="ghost"
                onClick={() => setActiveCategory(category)}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeCategory === category
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6 space-y-8 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex">
                  <div className="flex-1 p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                  <Skeleton className="w-24 h-24 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          activeCategory && groupedMenu[activeCategory] ? (
            <div key={activeCategory} className="category-section">
              <h2 className="text-lg font-semibold text-secondary mb-4">
                {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
              </h2>
              <div className="space-y-4">
                {groupedMenu[activeCategory].map((item: MenuItem) => (
                  <MenuItemComponent
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <FloatingCart
          itemCount={getCartItemCount()}
          total={getCartTotal()}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartItemQuantity}
        tableNumber={tableNumber}
      />

      {/* Progress Bar for Menu Loading */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Progress value={60} />
        </div>
      )}
    </div>
  );
}
