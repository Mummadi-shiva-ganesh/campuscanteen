import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
import { syncFirebaseSession, clearFirebaseSession } from "@/features/auth/actions/session";
import { isMockMode } from "@/lib/env";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  roll_number: string | null;
  year: number | null;
  branch: string | null;
  phone: string | null;
  role: "student" | "admin";
  wallet_balance: number;
  onboarding_completed: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function persistFirebaseSession(userObj: {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}) {
  if (isMockMode) {
    if (typeof document !== "undefined") {
      const encoded = btoa(JSON.stringify(userObj));
      document.cookie = `sb-mock-session=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
    return;
  }
  await syncFirebaseSession(userObj);
}

export const useAuthStore = create<AuthState>((set, get) => {
  const supabase = createClient();

  return {
    user: null,
    profile: null,
    loading: true,
    error: null,
    initialized: false,

    initialize: async () => {
      if (get().initialized) return;

      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("@/lib/firebase");

        // Listen to Firebase auth changes
        onAuthStateChanged(firebaseAuth, async (fbUser) => {
          if (fbUser) {
            // First, fetch profile data from users table
            const { data: profileData } = await supabase
              .from("users")
              .select("*")
              .eq("id", fbUser.uid)
              .single();

            const onboardingCompleted = profileData ? profileData.onboarding_completed === true : false;
            const role = profileData ? profileData.role : "student";

            const userObj = {
              id: fbUser.uid,
              email: fbUser.email || "",
              user_metadata: {
                full_name: fbUser.displayName || "",
                avatar_url: fbUser.photoURL || "",
                onboarding_completed: onboardingCompleted,
                role: role,
              },
            } as any;

            await persistFirebaseSession(userObj);

            set({ 
              user: userObj, 
              profile: profileData ? (profileData as UserProfile) : null, 
              loading: false 
            });
          } else {
            set({ user: null, profile: null, loading: false });
          }
        });
      } catch (err: any) {
        set({ error: err.message, loading: false });
      } finally {
        set({ initialized: true });
      }
    },

    signInWithGoogle: async () => {
      set({ loading: true, error: null });
      try {
        const { signInWithPopup } = await import("firebase/auth");
        const { auth: firebaseAuth, googleProvider } = await import("@/lib/firebase");
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const fbUser = result.user;

        if (fbUser) {
          // Fetch or Seed user profile in DB
          let { data: profileData, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", fbUser.uid)
            .single();

          const onboardingCompleted = profileData ? profileData.onboarding_completed === true : false;
          const role = profileData ? profileData.role : "student";

          const userObj = {
            id: fbUser.uid,
            email: fbUser.email || "",
            user_metadata: {
              full_name: fbUser.displayName || "",
              avatar_url: fbUser.photoURL || "",
              onboarding_completed: onboardingCompleted,
              role: role,
            },
          } as any;

          await persistFirebaseSession(userObj);

          set({ user: userObj });

          if (!fetchError && profileData) {
            set({ profile: profileData as UserProfile });
          } else {
            // User profile not found, create initial record for onboarding
            const { data: insertedProfile } = await supabase
              .from("users")
              .insert({
                id: fbUser.uid,
                email: fbUser.email || "",
                full_name: fbUser.displayName || "",
                roll_number: null,
                year: null,
                branch: null,
                phone: null,
                role: "student",
                wallet_balance: 0,
                onboarding_completed: false,
              })
              .select()
              .single();

            if (insertedProfile) {
              set({ profile: insertedProfile as UserProfile });
            }
          }
        }
      } catch (err: any) {
        set({ error: err.message });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        const { signOut: fbSignOut } = await import("firebase/auth");
        const { auth: firebaseAuth } = await import("@/lib/firebase");
        await fbSignOut(firebaseAuth);
      } catch {}
      
      await supabase.auth.signOut();
      await clearFirebaseSession();
      
      set({ user: null, profile: null, loading: false });
      window.location.href = "/login";
    },

    refreshProfile: async () => {
      const userState = get().user;
      if (!userState) return;

      const { data: profileData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userState.id)
        .single();

      if (!error && profileData) {
        // Reconstruct user metadata to match updated database profile (critical for onboarding redirect bypass)
        const updatedUser = {
          ...userState,
          user_metadata: {
            ...userState.user_metadata,
            onboarding_completed: profileData.onboarding_completed === true,
            role: profileData.role,
          }
        };

        await persistFirebaseSession(updatedUser);

        set({ 
          user: updatedUser,
          profile: profileData as UserProfile 
        });
      }
    },
  };
});
