"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Wallet, Smartphone, QrCode, CheckCircle, Shield, Lock, AlertTriangle, X, Key, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/features/cart/store"
import { useAuthStore } from "@/features/auth/store"
import { createOrder } from "@/features/orders/actions"
import { toast } from "sonner"

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false)
      return
    }
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}


export default function PaymentPage() {
  const router = useRouter()
  const { items, getTotals, clearCart } = useCartStore()
  const { subtotal, tax, packaging, total } = getTotals()
  
  const profile = useAuthStore((state) => state.profile)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)

  const [selectedMethod, setSelectedMethod] = useState("wallet")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [customKeyId, setCustomKeyId] = useState("")

  // Load custom Razorpay key ID if stored in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("canteen_razorpay_key_id")
      if (stored) {
        setCustomKeyId(stored)
      }
    }
  }, [])

  // Redirect back to menu if cart is empty and order hasn't succeeded
  useEffect(() => {
    if (items.length === 0 && !isSuccess) {
      router.push("/menu")
    }
  }, [items, isSuccess, router])

  const paymentMethods = [
    {
      id: "wallet",
      name: "Campus Wallet",
      description: profile ? `Balance: ₹${profile.wallet_balance}` : "Loading balance...",
      icon: Wallet,
      color: "from-primary to-orange-600",
      recommended: true,
    },
    {
      id: "upi",
      name: "UPI",
      description: "Google Pay, PhonePe, Paytm",
      icon: Smartphone,
      color: "from-purple-500 to-purple-600",
      recommended: false,
    },
    {
      id: "cod",
      name: "Pay at Counter (COD)",
      description: "Pay with Cash/Card at counter",
      icon: QrCode,
      color: "from-green-500 to-green-600",
      recommended: false,
    },
  ]

  const handlePayment = async () => {
    if (selectedMethod === "wallet") {
      if (!profile) {
        toast.error("User profile not loaded. Please reload.")
        return
      }
      if (Number(profile.wallet_balance) < total) {
        toast.error("Insufficient wallet balance. Please add funds to your wallet.")
        return
      }
    }

    if (selectedMethod === "upi") {
      setIsProcessing(true)

      // Use env-configured key or locally entered key
      const activeKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || customKeyId

      if (!activeKeyId || activeKeyId.trim() === "" || activeKeyId === "rzp_test_canteenMockPayID12") {
        setIsProcessing(false)
        setShowConfigModal(true)
        return
      }

      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded) {
        setIsProcessing(false)
        toast.error("Failed to load payment gateway SDK. Please check your network connection.")
        return
      }

      const options = {
        key: activeKeyId,
        amount: Math.round(total * 100),
        currency: "INR",
        name: "Campus Canteen",
        description: "Payment for food order",
        handler: async function (response: any) {
          try {
            const order = await createOrder({
              items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
              paymentMethod: "upi",
            })
            
            clearCart()
            await refreshProfile()
            setIsProcessing(false)
            setIsSuccess(true)
            
            setTimeout(() => {
              router.push(`/confirmation?orderId=${order.booking_id}`)
            }, 1500)
          } catch (err: any) {
            setIsProcessing(false)
            toast.error(err.message || "Failed to finalize order after payment success.")
          }
        },
        prefill: {
          name: profile?.full_name || "",
          email: profile?.email || "",
          contact: profile?.phone || "",
          method: "upi",
        },
        theme: {
          color: "#F97316",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
            toast.error("Payment cancelled.")
          }
        }
      }

      try {
        const rzp = new (window as any).Razorpay(options)
        rzp.on("payment.failed", function (response: any) {
          setIsProcessing(false)
          setShowConfigModal(true)
        })
        rzp.open()
      } catch (err) {
        setIsProcessing(false)
        setShowConfigModal(true)
      }
      return
    }

    setIsProcessing(true)
    try {
      const order = await createOrder({
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        paymentMethod: selectedMethod as "wallet" | "cod",
      })
      
      clearCart()
      await refreshProfile()
      setIsProcessing(false)
      setIsSuccess(true)
      
      setTimeout(() => {
        router.push(`/confirmation?orderId=${order.booking_id}`)
      }, 1500)
    } catch (err: any) {
      setIsProcessing(false)
      toast.error(err.message || "Failed to place order.")
    }
  }

  const isWalletInsufficient = selectedMethod === "wallet" && profile && Number(profile.wallet_balance) < total

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-28 pb-40 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payment</h1>
              <p className="text-muted-foreground">Choose your payment method</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="font-semibold text-foreground mb-4">Select Payment Method</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          selectedMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                            <method.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{method.name}</span>
                              {method.recommended && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === method.id
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}>
                            {selectedMethod === method.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-white"
                              />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Wallet Quick Pay Preview */}
              {selectedMethod === "wallet" && profile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-br ${
                    isWalletInsufficient 
                      ? "from-destructive to-red-600" 
                      : "from-primary to-orange-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm opacity-80">Wallet Balance</p>
                      <p className="text-3xl font-bold">₹{profile.wallet_balance}</p>
                    </div>
                    <Wallet className="w-10 h-10 opacity-50" />
                  </div>
                  {isWalletInsufficient ? (
                    <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-xl border border-white/20">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Insufficient funds! You need ₹{total - Number(profile.wallet_balance)} more to place this order.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="opacity-80">After payment</span>
                      <span className="font-semibold">₹{(Number(profile.wallet_balance) - total).toFixed(2)} remaining</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 p-4 bg-muted rounded-xl"
              >
                <Shield className="w-5 h-5 text-success" />
                <div className="text-sm">
                  <span className="font-medium text-foreground">Secure Checkout</span>
                  <span className="text-muted-foreground"> - Your order parameters are verified directly on the server</span>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-28 h-fit"
            >
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-foreground mb-4">Order Summary</h3>
                
                {/* Items */}
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        {item.name} <span className="text-foreground font-medium">x{item.quantity}</span>
                      </span>
                      <span className="text-foreground">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border my-4" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span className="text-foreground">₹{tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Packing & Handling</span>
                    <span className="text-foreground">₹{packaging}</span>
                  </div>
                  <div className="h-px bg-border my-3" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">₹{total}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-40">
        <div className="max-w-4xl mx-auto">
          {isWalletInsufficient ? (
            <Link href="/wallet">
              <Button className="w-full h-14 rounded-xl text-base gap-2 bg-gradient-to-r from-orange-500 to-primary">
                <Wallet className="w-5 h-5" />
                Recharge Wallet to Pay
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isProcessing || isSuccess}
              className="w-full h-14 rounded-xl text-base gap-2"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Processing Order...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Order Placed!
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {selectedMethod === "wallet" 
                    ? `Pay ₹${total} via Wallet` 
                    : selectedMethod === "upi" 
                    ? "Pay via UPI" 
                    : `Confirm Order (₹${total})`}
                </>
              )}
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secured by Campus Canteen
          </p>
        </div>
      </div>



      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-success mx-auto flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h2>
              <p className="text-muted-foreground">Redirecting to your order receipt...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Razorpay Configuration & Simulation Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfigModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-md w-full relative shadow-2xl text-left space-y-6"
            >
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary" />
                  UPI Payment Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  To test the real Razorpay Checkout window, you must configure your own free **Razorpay Test Key ID** (starting with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">rzp_test_</code>).
                </p>
              </div>

              {/* Key ID input */}
              <div className="space-y-2 border border-border/80 bg-muted/40 p-4 rounded-2xl">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Razorpay Test Key ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                    value={customKeyId}
                    onChange={(e) => setCustomKeyId(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  />
                  <Button
                    onClick={async () => {
                      if (!customKeyId.trim().startsWith("rzp_test_")) {
                        toast.error("Invalid key format. Razorpay test keys start with 'rzp_test_'.")
                        return
                      }
                      localStorage.setItem("canteen_razorpay_key_id", customKeyId.trim())
                      setShowConfigModal(false)
                      toast.success("Test Key ID saved! Retrying payment...")
                      setTimeout(() => {
                        handlePayment()
                      }, 500)
                    }}
                    className="rounded-xl"
                  >
                    Save & Pay
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-normal flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Get your key from Razorpay Dashboard (Test Mode) → Settings → API Keys.</span>
                </p>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs text-muted-foreground/60 uppercase font-semibold">Or bypass payment</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  Simulate Test Success
                </div>
                <p className="text-xs text-muted-foreground">
                  Bypass the gateway check to place the order immediately as a mock successful payment.
                </p>
                <Button 
                  onClick={async () => {
                    setShowConfigModal(false)
                    setIsProcessing(true)
                    try {
                      const order = await createOrder({
                        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
                        paymentMethod: "upi",
                      })
                      
                      clearCart()
                      await refreshProfile()
                      setIsProcessing(false)
                      setIsSuccess(true)
                      
                      setTimeout(() => {
                        router.push(`/confirmation?orderId=${order.booking_id}`)
                      }, 1500)
                    } catch (err: any) {
                      setIsProcessing(false)
                      toast.error(err.message || "Failed to process UPI order.")
                    }
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-orange-600 font-semibold shadow-md shadow-primary/20"
                >
                  Confirm Mock Success
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-20 md:hidden" />
    </main>
  )
}
