"use client"

import { useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ChefHat, Chrome, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

function LoginContent() {
  const { signInWithGoogle, user, profile, loading, error, initialize } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? "/"

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading && user) {
      if (profile?.onboarding_completed) {
        router.push(redirectTo)
      } else {
        router.push("/onboarding")
      }
    }
  }, [user, profile, loading, router, redirectTo])

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (err: any) {
      toast.error(err.message || "Google Sign-In failed")
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass rounded-3xl p-8 border border-border shadow-2xl relative">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
            >
              <ChefHat className="w-9 h-9 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight text-center">
              Campus<span className="text-primary">Canteen</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Skip queues. Order instantly. Pay digitally.
            </p>
          </div>

          {/* Social Log In */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold gap-3 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Chrome className="w-5 h-5" />
              )}
              Sign in with Google
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-destructive text-center mt-6 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          {/* Footer Info */}
          <p className="text-[10px] text-muted-foreground/60 text-center mt-8">
            Campus Canteen V1 • Secure Authentication Environment
          </p>
        </div>
      </motion.div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2 text-sm">Loading sign in...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
