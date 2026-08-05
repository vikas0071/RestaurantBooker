import { useState } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UtensilsCrossed, Lock, User } from "lucide-react";

async function ensureAdminProfile(firebaseUser: any, defaultName?: string) {
  const uid = firebaseUser.uid;
  let restaurantName = defaultName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "My Restaurant";
  
  try {
    const adminDocRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      if (data.restaurantName) {
        restaurantName = data.restaurantName;
      }
    } else {
      await setDoc(adminDocRef, {
        email: firebaseUser.email || "",
        restaurantName,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Firestore admin profile notice:", err);
  }

  const userObj = {
    uid,
    email: firebaseUser.email,
    restaurantName,
  };
  localStorage.setItem("user", JSON.stringify(userObj));
  return userObj;
}

async function isShopConfigured(uid: string): Promise<boolean> {
  try {
    const adminSnap = await getDoc(doc(db, "admins", uid));
    return adminSnap.exists() && !!adminSnap.data()?.isSetupComplete;
  } catch (e) {
    return false;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Required fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const isSetup = await isShopConfigured(userCred.user.uid);
      if (isSetup) {
        toast({ title: "Login successful!", description: "Welcome back!" });
        navigate("/admin");
      } else {
        toast({ title: "Setup your shop", description: "Please configure your restaurant shop." });
        navigate("/setup-shop");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isSetup = await isShopConfigured(result.user.uid);
      if (isSetup) {
        toast({ title: "Signed in with Google!", description: "Welcome back!" });
        navigate("/admin");
      } else {
        toast({ title: "Setup your shop", description: "Let's set up your restaurant shop first!" });
        navigate("/setup-shop");
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google sign-in failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">
              Restaurant Admin
            </CardTitle>
            <p className="text-gray-600 mt-2">Sign in to manage your restaurant</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-12 flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </Button>

            <div className="mt-6 text-center text-sm text-gray-600">
              <a href="/register" className="text-primary underline">Don't have an account? Register</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}