import { doc, updateDoc, getDoc, collection, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Built-in default valid license keys (can also be dynamically stored in Firestore)
export const BUILTIN_KEYS: Record<string, string> = {
  "PRO-2026-VIP": "Lifetime Premium VIP Access",
  "RESTAURANT-PREMIUM-100": "Annual Premium Subscription",
  "VIKAS-PRO-888": "Special Partner License",
  "VIP-SHOP-2026": "Standard Commercial License",
};

// Super admin email list (Only these specific emails have automatic Super Admin access)
export const SUPER_ADMIN_EMAILS = [
  "admin@restaurantbooker.com",
  "vikas@restaurantbooker.com",
  "vikasbishnoi@gmail.com",
];

// Master Passcode for Super Admin Access (Change this PIN whenever you want)
export let SUPER_ADMIN_MASTER_PIN = "SUPER2026";

export async function getSuperAdminPin(): Promise<string> {
  try {
    const pinDoc = await getDoc(doc(db, "systemSettings", "security"));
    if (pinDoc.exists() && pinDoc.data()?.masterPin) {
      return pinDoc.data().masterPin;
    }
  } catch (e) {
    console.warn("Firestore PIN fetch notice:", e);
  }
  return localStorage.getItem("superAdminPin") || SUPER_ADMIN_MASTER_PIN;
}

export async function setSuperAdminPin(newPin: string): Promise<boolean> {
  const clean = newPin.trim();
  if (!clean) return false;
  try {
    await setDoc(doc(db, "systemSettings", "security"), {
      masterPin: clean,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    localStorage.setItem("superAdminPin", clean);
    SUPER_ADMIN_MASTER_PIN = clean;
    return true;
  } catch (e) {
    console.error("Failed to update PIN in Firestore:", e);
    localStorage.setItem("superAdminPin", clean);
    SUPER_ADMIN_MASTER_PIN = clean;
    return true;
  }
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
}

export async function deleteLicenseKeyFromDb(keyStr: string): Promise<boolean> {
  const clean = keyStr.trim().toUpperCase();
  try {
    // Delete from licenseKeys collection
    await deleteDoc(doc(db, "licenseKeys", clean));
    // Add to revokedKeys so built-in keys are also invalidated
    await setDoc(doc(db, "revokedKeys", clean), {
      revoked: true,
      revokedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error("Failed to delete license key:", e);
    return false;
  }
}

export async function redeemLicenseKey(uid: string, inputKey: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = inputKey.trim().toUpperCase();

  if (!cleanKey) {
    return { success: false, message: "Please enter a valid license key." };
  }

  // 0. Check if key is revoked
  try {
    const revokedSnap = await getDoc(doc(db, "revokedKeys", cleanKey));
    if (revokedSnap.exists()) {
      return { success: false, message: "This License Key has been deleted/revoked by the Super Admin." };
    }
  } catch (e) {
    console.warn("Revoked check notice:", e);
  }

  // 1. Check built-in keys first
  let isKeyValid = !!BUILTIN_KEYS[cleanKey];

  // 2. Check Firestore licenseKeys collection if not in built-in
  if (!isKeyValid) {
    try {
      const keyDoc = await getDoc(doc(db, "licenseKeys", cleanKey));
      if (keyDoc.exists() && keyDoc.data()?.active !== false) {
        isKeyValid = true;
      }
    } catch (e) {
      console.warn("Firestore license key check notice:", e);
    }
  }

  if (!isKeyValid) {
    return { success: false, message: "Invalid or expired License Key. Please contact support." };
  }

  // Upgrade the user in Firestore
  try {
    const adminRef = doc(db, "admins", uid);
    await updateDoc(adminRef, {
      isPremium: true,
      planType: "pro",
      subscriptionStatus: "active",
      activatedKey: cleanKey,
      unlockedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "🎉 Success! Your account has been upgraded to PRO / Premium Plan!",
    };
  } catch (err: any) {
    // If doc update failed, try setDoc merge
    try {
      const adminRef = doc(db, "admins", uid);
      await setDoc(adminRef, {
        isPremium: true,
        planType: "pro",
        subscriptionStatus: "active",
        activatedKey: cleanKey,
        unlockedAt: new Date().toISOString(),
      }, { merge: true });

      return {
        success: true,
        message: "🎉 Success! Your account has been upgraded to PRO / Premium Plan!",
      };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to update subscription status." };
    }
  }
}

export async function toggleUserPremium(uid: string, isPremium: boolean): Promise<boolean> {
  try {
    const adminRef = doc(db, "admins", uid);
    await setDoc(adminRef, {
      isPremium,
      planType: isPremium ? "pro" : "free",
      subscriptionStatus: isPremium ? "active" : "free",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Failed to toggle premium:", e);
    return false;
  }
}
