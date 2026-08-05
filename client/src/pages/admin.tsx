import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrderCard from "@/components/admin/order-card";
import MenuManagement from "@/components/admin/menu-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Settings, LogOut, ShoppingBag, UtensilsCrossed, Users, IndianRupee, Clock } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useLocation } from "wouter";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editShopName, setEditShopName] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        navigate("/login");
      } else {
        // Read local storage first for immediate rendering
        let nameFromLocal = "";
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.restaurantName) nameFromLocal = parsed.restaurantName;
          }
        } catch (e) {}

        try {
          const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
          const rName = (adminDoc.exists() && adminDoc.data().restaurantName) || nameFromLocal || firebaseUser.displayName || "My Restaurant";
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            restaurantName: rName,
          });
          setEditShopName(rName);
          localStorage.setItem("user", JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email, restaurantName: rName }));
        } catch (e) {
          console.warn("Admin doc read notice:", e);
          const rName = nameFromLocal || firebaseUser.displayName || "My Restaurant";
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            restaurantName: rName,
          });
          setEditShopName(rName);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    const q = query(collection(db, "orders"), where("adminId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.warn("Firestore orders snapshot notice:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    signOut(auth);
    navigate("/login");
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShopName.trim() || !user?.uid) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "admins", user.uid), {
        restaurantName: editShopName.trim(),
        email: user.email,
        isSetupComplete: true,
      }, { merge: true });

      const updatedUser = { ...user, restaurantName: editShopName.trim() };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast({
        title: "Shop Settings Saved!",
        description: `Restaurant name updated to ${editShopName.trim()}.`,
      });
      setIsSettingsOpen(false);
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update shop name.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders?.filter(order => {
    const matchesFilter = activeFilter === "all" || order.status === activeFilter;
    const matchesSearch = order.id.toString().includes(searchQuery) || 
                         order.tableId.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  }) || [];

  const getOrderCounts = () => {
    if (!orders) return { all: 0, pending: 0, preparing: 0, served: 0 };
    
    return orders.reduce((counts, order) => {
      counts.all++;
      counts[order.status as keyof typeof counts]++;
      return counts;
    }, { all: 0, pending: 0, preparing: 0, served: 0 });
  };

  const orderCounts = getOrderCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary">
                  {user.restaurantName} <span className="text-primary text-sm font-semibold uppercase px-2 py-0.5 bg-primary/10 rounded-md ml-2">Admin</span>
                </h1>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-emerald-700">Live Orders</span>
              </div>

              {/* Shop Settings Dialog */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-gray-300">
                    <Settings className="h-4 w-4" />
                    <span>Shop Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Edit Restaurant Shop Details</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveShopSettings} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Restaurant / Shop Name</label>
                      <Input
                        value={editShopName}
                        onChange={(e) => setEditShopName(e.target.value)}
                        placeholder="e.g. Vikas Bistro"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSavingSettings}>
                        {isSavingSettings ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-secondary">{orderCounts.all}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{orderCounts.pending}</p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Preparing</p>
                      <p className="text-2xl font-bold text-orange-600">{orderCounts.preparing}</p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Served</p>
                      <p className="text-2xl font-bold text-green-600">{orderCounts.served}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-secondary">Order Management</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter tables" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tables</SelectItem>
                        <SelectItem value="1-10">Table 1-10</SelectItem>
                        <SelectItem value="11-20">Table 11-20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    onClick={() => setActiveFilter("all")}
                    size="sm"
                  >
                    All Orders ({orderCounts.all})
                  </Button>
                  <Button
                    variant={activeFilter === "pending" ? "default" : "outline"}
                    onClick={() => setActiveFilter("pending")}
                    size="sm"
                  >
                    Pending ({orderCounts.pending})
                  </Button>
                  <Button
                    variant={activeFilter === "preparing" ? "default" : "outline"}
                    onClick={() => setActiveFilter("preparing")}
                    size="sm"
                  >
                    Preparing ({orderCounts.preparing})
                  </Button>
                  <Button
                    variant={activeFilter === "served" ? "default" : "outline"}
                    onClick={() => setActiveFilter("served")}
                    size="sm"
                  >
                    Served ({orderCounts.served})
                  </Button>
                </div>
              </div>

              {/* Orders Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="space-y-2 mb-4">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 flex-1" />
                          <Skeleton className="h-8 flex-1" />
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  )}
                </div>

                {!isLoading && filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">No orders found</p>
                      <p className="text-sm">
                        {searchQuery ? 'Try adjusting your search' : 'Orders will appear here when placed'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IndianRupee className="w-5 h-5 mr-2" />
                    Today's Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ₹{orders?.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    From {orders?.length || 0} orders
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Average Order Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">25 min</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Kitchen efficiency
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Tables Served
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {new Set(orders?.map(order => order.tableId)).size || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Unique tables today
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
