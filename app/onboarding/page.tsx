"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ChefHat, Loader2, Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { onboardingSchema, type OnboardingInput } from "@/validators/onboarding"
import { onboardUser } from "@/features/auth/actions/onboard"
import { useAuthStore } from "@/features/auth/store"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const { signOut, refreshProfile } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      rollNumber: "",
      year: 1,
      branch: "",
      phone: "",
    },
  })

  const onSubmit = async (data: OnboardingInput) => {
    setSubmitting(true)
    try {
      const res = await onboardUser(data)
      if (!res.success) {
        throw new Error(res.error)
      }
      toast.success("Profile setup completed successfully!")
      
      // Update state in Zustand store and redirect
      await refreshProfile()
      
      // Force page refresh to update auth middleware cookie state
      window.location.href = "/"
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile details")
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="glass rounded-3xl p-8 border border-border shadow-2xl relative">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 relative">
            <button
              onClick={() => signOut()}
              className="absolute top-0 right-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-md shadow-primary/20">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-1.5">
              Setup Your Profile <Sparkles className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Please complete your details to unlock campus ordering
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                className="h-11 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Roll Number & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="text-sm font-semibold">
                  Roll Number
                </Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g. 21BCE0123"
                  className="h-11 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  {...register("rollNumber")}
                />
                {errors.rollNumber && (
                  <p className="text-xs text-destructive">{errors.rollNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-semibold">
                  Branch
                </Label>
                <Input
                  id="branch"
                  placeholder="e.g. CSE, ECE"
                  className="h-11 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  {...register("branch")}
                />
                {errors.branch && (
                  <p className="text-xs text-destructive">{errors.branch.message}</p>
                )}
              </div>
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-semibold">
                Academic Year
              </Label>
              <Select
                onValueChange={(val) => setValue("year", Number(val))}
                defaultValue="1"
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted border-0 focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select current year" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Phone Number
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  +91
                </span>
                <Input
                  id="phone"
                  placeholder="Enter 10-digit number"
                  className="h-11 pl-12 rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-primary/20 mt-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Details...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

        </div>
      </motion.div>
    </main>
  )
}
