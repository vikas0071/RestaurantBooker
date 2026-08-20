import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isSuperAdminEmail, BUILTIN_KEYS, toggleUserPremium, getSuperAdminPin, setSuperAdminPin, deleteLicenseKeyFromDb } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Crown, Store, Search, Key, Sparkles, Check, Copy, RefreshCw, UserCheck, UserX, ArrowLeft, Lock, ShieldAlert, Settings, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function SuperAdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customKeyName, setCustomKeyName] = useState("");
  const [customKeys, setCustomKeys] = useState<Record<string, string>>({});
  const [revokedKeys, setRevokedKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Security PIN Verification State
  const [pinInput, setPinInput] = useState("");
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("super_admin_pin_unlocked") === "true";
  });
  const [pinError, setPinError] = useState("");

  // Change PIN State
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [updatingPin, setUpdatingPin] = useState(false);

  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }
      setCurrentUser(firebaseUser);

      // Strict Access Control Check
      const isEmailAuthorized = isSuperAdminEmail(firebaseUser.email);
      const isUnlocked = isEmailAuthorized || sessionStorage.getItem("super_admin_pin_unlocked") === "true";

      if (isEmailAuthorized) {
        setIsPinUnlocked(true);
      }

      setLoading(false);

      if (!isUnlocked && !isEmailAuthorized) {
        console.warn("Unauthorized access attempt to /super-admin by:", firebaseUser.email);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Listen to all registered restaurant admins in Firestore ONLY IF authorized
  useEffect(() => {
    if (!currentUser) return;
    const isAuthorized = isSuperAdminEmail(currentUser.email) || isPinUnlocked;
    if (!isAuthorized) return;

    const unsubAdmins = onSnapshot(
      collection(db, "admins"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        }));
        setRestaurants(list);
      },
      (error) => {
        console.warn("Super admin listener notice:", error);
      }
    );

    // Listen to custom license keys in Firestore
    const unsubKeys = onSnapshot(
      collection(db, "licenseKeys"),
      (snapshot) => {
        const keyMap: Record<string, string> = {};
        snapshot.docs.forEach((d) => {
          keyMap[d.id] = d.data()?.description || "Generated License Key";
        });
        setCustomKeys(keyMap);
      },
      (error) => {
        console.warn("Firestore licenseKeys listener notice:", error);
      }
    );

    // Listen to revoked keys in Firestore
    const unsubRevoked = onSnapshot(
      collection(db, "revokedKeys"),
      (snapshot) => {
        setRevokedKeys(snapshot.docs.map((d) => d.id));
      },
      (error) => {
        console.warn("Firestore revokedKeys listener notice:", error);
      }
    );

    return () => {
      unsubAdmins();
      unsubKeys();
      unsubRevoked();
    };
  }, [currentUser, isPinUnlocked]);

  const handleDeleteKey = async (keyStr: string) => {
    if (!window.confirm(`Are you sure you want to delete/revoke license key "${keyStr}"?`)) return;

    const ok = await deleteLicenseKeyFromDb(keyStr);
    if (ok) {
      toast({
        title: "🗑️ License Key Deleted",
        description: `Key "${keyStr}" has been revoked and removed.`,
      });
    } else {
      toast({
        title: "Delete Failed",
        description: "Could not delete license key.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentValidPin = await getSuperAdminPin();
    if (pinInput.trim() === currentValidPin || isSuperAdminEmail(currentUser?.email)) {
      sessionStorage.setItem("super_admin_pin_unlocked", "true");
      setIsPinUnlocked(true);
      setPinError("");
      toast({
        title: "Access Granted",
        description: "Welcome to Super Admin Control Panel!",
      });
    } else {
      setPinError("Incorrect Master Security PIN. Access denied.");
      toast({
        title: "Access Denied ⛔",
        description: "Invalid Super Admin Security Passcode.",
        variant: "destructive",
      });
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim()) return;
    setUpdatingPin(true);
    const ok = await setSuperAdminPin(newPinInput.trim());
    setUpdatingPin(false);
    if (ok) {
      toast({
        title: "🔑 Passcode Updated!",
        description: `New Super Admin Master Passcode is now "${newPinInput.trim()}".`,
      });
      setNewPinInput("");
      setIsChangePinOpen(false);
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update Security PIN.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePremium = async (uid: string, currentStatus: boolean, name: string) => {
    const nextStatus = !currentStatus;
    const ok = await toggleUserPremium(uid, nextStatus);
    if (ok) {
      toast({
        title: nextStatus ? "🎉 Premium Granted!" : "Status Updated",
        description: `${name} is now on ${nextStatus ? "PRO / Premium" : "Free"} plan.`,
      });
    } else {
      toast({
        title: "Action Failed",
        description: "Could not update restaurant status.",
        variant: "destructive",
      });
    }
  };

  const generateLicenseKey = async () => {
    const keyPrefix = customKeyName.trim() ? customKeyName.trim().toUpperCase().replace(/\s+/g, "-") : "VIP";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newKey = `RESTO-${keyPrefix}-${randomSuffix}`;

    try {
      await setDoc(doc(db, "licenseKeys", newKey), {
        key: newKey,
        description: `Generated Key for ${customKeyName || "Customer"}`,
        createdAt: new Date().toISOString(),
        active: true,
      });

      setCustomKeys((prev) => ({ ...prev, [newKey]: customKeyName || "Custom License Key" }));
      setCustomKeyName("");
      toast({
        title: "✨ License Key Generated!",
        description: `Key ${newKey} is now active and ready to share!`,
      });
    } catch (e: any) {
      toast({
        title: "Key Generation Failed",
        description: e.message || "Failed to save key in database.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(keyStr);
    toast({ title: "Copied!", description: `Key "${keyStr}" copied to clipboard.` });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isOwner = isSuperAdminEmail(currentUser?.email);
  const isAuthorized = isOwner || isPinUnlocked;

  // ⛔ ACCESS DENIED GATE FOR UNAUTHORIZED USERS
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900/10 via-background to-gray-900/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-red-200 bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Super Admin Verification
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm mt-1">
              This area is strictly restricted to the Platform Owner ({currentUser?.email}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-red-600" /> Enter Master Passcode / PIN
                </label>
                <Input
                  type="password"
                  placeholder="Enter Passcode (e.g. SUPER2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="h-12 border-red-200 focus:border-red-500 font-mono text-center text-lg"
                  required
                />
                {pinError && <p className="text-xs font-semibold text-red-600">{pinError}</p>}
              </div>

              <Button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-md">
                <ShieldCheck className="w-5 h-5 mr-2" /> Verify Security PIN
              </Button>
            </form>

            <div className="pt-2 border-t border-gray-100 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = restaurants.length;
  const premiumCount = restaurants.filter((r) => r.isPremium).length;
  const freeCount = totalCount - premiumCount;

  return (
    <div className="min-h-screen bg-gray-100/70 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Super Admin License Control</h1>
                <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> MASTER PANEL
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Manage restaurant subscriptions, grant/revoke PRO access, and generate activation keys.
              </p>
            </div>
          </div>

          {/* Change Security PIN Button */}
          <Dialog open={isChangePinOpen} onOpenChange={setIsChangePinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-gray-300">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Change Master Passcode</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" /> Update Master Passcode / PIN
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Master Passcode</label>
                  <Input
                    type="password"
                    placeholder="Enter new PIN (e.g. MYSECRET123)"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="h-11 font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This new passcode will be saved and required for accessing the Super Admin panel.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsChangePinOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updatingPin} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    {updatingPin ? "Saving..." : "Save New PIN"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered Shops</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Store className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active PRO / Premium</p>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">{premiumCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Crown className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-gray-400">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free Tier Shops</p>
                <p className="text-3xl font-extrabold text-gray-600 mt-1">{freeCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                <Store className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Key Generator */}
        <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
              <Key className="w-5 h-5 text-amber-600" /> License Key Generator & Quick Keys
            </CardTitle>
            <CardDescription className="text-amber-800">
              Give these activation codes to customers so they can upgrade to PRO self-service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Target Restaurant Name or Client Note (e.g. Royal Cafe)"
                value={customKeyName}
                onChange={(e) => setCustomKeyName(e.target.value)}
                className="bg-white border-amber-300"
              />
              <Button onClick={generateLicenseKey} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                <Sparkles className="w-4 h-4 mr-2" /> Generate New Key
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Available Active License Keys:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries({ ...BUILTIN_KEYS, ...customKeys })
                  .filter(([k]) => !revokedKeys.includes(k.toUpperCase()))
                  .map(([k, desc]) => (
                    <div
                      key={k}
                      className="bg-white border border-amber-300 rounded-lg p-1.5 px-3 flex items-center gap-2 text-xs font-mono text-amber-900 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k)}
                        className="flex items-center gap-1.5 hover:text-amber-700 transition-colors"
                        title="Click to copy key"
                      >
                        {copiedKey === k ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="font-bold">{k}</span>
                        <span className="text-[10px] text-gray-400 font-sans">({desc})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteKey(k)}
                        className="ml-1 text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete / Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {Object.entries({ ...BUILTIN_KEYS, ...customKeys }).filter(([k]) => !revokedKeys.includes(k.toUpperCase())).length === 0 && (
                  <p className="text-xs text-gray-400 italic">No active license keys available. Generate a new key above!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Management List */}
        <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Registered Restaurant Clients</CardTitle>
              <CardDescription>Grant or revoke Premium features for any account instantly.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shop or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200 text-gray-500 font-semibold uppercase text-xs">
                    <th className="py-3.5 px-6">Restaurant Name</th>
                    <th className="py-3.5 px-6">Owner Email</th>
                    <th className="py-3.5 px-6">Current Plan</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRestaurants.map((r) => {
                    const isPrem = !!r.isPremium;
                    return (
                      <tr key={r.uid} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {r.restaurantName?.[0]?.toUpperCase() || "R"}
                          </div>
                          <span>{r.restaurantName || "Unnamed Shop"}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-mono text-xs">{r.email || "No Email"}</td>
                        <td className="py-4 px-6">
                          {isPrem ? (
                            <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1 w-max">
                              <Crown className="w-3.5 h-3.5" /> PRO PREMIUM
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-300 w-max">
                              FREE TIER
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isPrem ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTogglePremium(r.uid, true, r.restaurantName)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1.5" /> Revoke PRO
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleTogglePremium(r.uid, false, r.restaurantName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                            >
                              <UserCheck className="w-4 h-4 mr-1.5" /> Grant PRO Access
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRestaurants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-500">
                        No restaurant clients found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
