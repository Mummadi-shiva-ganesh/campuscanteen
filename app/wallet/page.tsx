"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ArrowUpRight, ArrowDownLeft, QrCode, CreditCard, Smartphone, History, ChevronRight, Loader2, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { useAuthStore } from "@/features/auth/store"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getWalletTransactions, addWalletFunds } from "@/features/wallet/actions"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.svg" // Fallback: since we installed qrcode.react, we can import from qrcode.react
// Let's import from qrcode.react directly to avoid error:
import { QRCodeSVG as QrCodeComponent } from "qrcode.react"

const quickAmounts = [100, 200, 500, 1000]

export default function WalletPage() {
  const queryClient = useQueryClient()
  const { profile, refreshProfile, initialize } = useAuthStore()
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  
  // Payment modal simulation states
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  // Fetch real database transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["walletTransactions"],
    queryFn: () => getWalletTransactions(),
    enabled: !!profile,
  })

  // Mutation to add funds to wallet
  const addFundsMutation = useMutation({
    mutationFn: (amount: number) => addWalletFunds(amount, "Wallet Top-up (UPI Mock)"),
    onSuccess: async () => {
      toast.success("Wallet recharged successfully!")
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] })
      await refreshProfile() // Update user's wallet_balance locally
      setShowUpiModal(false)
      setShowAddMoney(false)
      setSelectedAmount(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete recharge")
    },
  })

  const handleAddMoneySubmit = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      toast.error("Please select or enter a valid amount")
      return
    }
    // Launch the simulated UPI verification screen
    setShowUpiModal(true)
  }

  const handleConfirmMockPayment = () => {
    if (!selectedAmount) return
    setPaymentProcessing(true)
    
    // Simulate network delay
    setTimeout(() => {
      addFundsMutation.mutate(selectedAmount)
      setPaymentProcessing(false)
    }, 1500)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const walletBalance = profile?.wallet_balance || 0

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-28 pb-32 md:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Wallet Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            <div className="bg-gradient-to-br from-primary via-primary to-orange-600 rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <span className="font-semibold">Campus Canteen Wallet</span>
                  </div>
                  <QrCode className="w-8 h-8 opacity-80" />
                </div>

                {/* Balance */}
                <div className="mb-6">
                  <p className="text-sm opacity-80 mb-1">Available Balance</p>
                  <p className="text-4xl sm:text-5xl font-bold">₹{Number(walletBalance).toFixed(2)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowAddMoney(!showAddMoney)}
                    variant="secondary"
                    className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => toast.info("QR wallet scanning is available under checkouts")}
                    className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Pay via QR
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Add Money Panel */}
          <AnimatePresence>
            {showAddMoney && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Add Money to Wallet</h3>
                  
                  {/* Quick Amounts */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`p-3 rounded-xl text-center font-medium transition-all ${
                          selectedAmount === amount
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2 mb-4">
                    <button
                      onClick={handleAddMoneySubmit}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-foreground">UPI (Google Pay, PhonePe, Paytm)</span>
                        <p className="text-xs text-muted-foreground">Recharge instantly using simulated QR Code</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <Button 
                    className="w-full h-12 rounded-xl text-base"
                    disabled={!selectedAmount}
                    onClick={handleAddMoneySubmit}
                  >
                    Proceed with ₹{selectedAmount || 0}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <History className="w-5 h-5" />
                Transaction History
              </h3>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    className="bg-card rounded-xl border border-border p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "credit" ? "bg-success/10" : "bg-muted"
                        }`}>
                          {tx.type === "credit" ? (
                            <ArrowDownLeft className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === "credit" ? "text-success" : "text-foreground"
                        }`}>
                          {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">{tx.type}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No transactions recorded yet.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Simulated UPI Checkout Modal */}
      <AnimatePresence>
        {showUpiModal && selectedAmount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm relative shadow-2xl"
            >
              <button
                onClick={() => setShowUpiModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-foreground">UPI Sandbox Payment</h3>
                <p className="text-xs text-muted-foreground mt-1">Scan this simulated QR to pay digitally</p>
              </div>

              {/* QR Code container */}
              <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-md mb-5 border border-border">
                <QrCodeComponent
                  value={`upi://pay?pa=canteen@upi&pn=CampusCanteen&am=${selectedAmount}&cu=INR`}
                  size={160}
                />
              </div>

              <div className="space-y-3 mb-6 text-sm text-center">
                <p className="text-muted-foreground">
                  Recharging <span className="font-semibold text-foreground">Campus Valute</span>
                </p>
                <p className="text-2xl font-bold text-foreground">₹{selectedAmount}</p>
                <div className="bg-muted/50 p-2.5 rounded-lg text-xs text-muted-foreground text-left flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
                  <span>This is a simulated Sandbox transaction. Clicking confirm will credit mock funds immediately.</span>
                </div>
              </div>

              <Button
                onClick={handleConfirmMockPayment}
                disabled={paymentProcessing}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing mock transaction...
                  </>
                ) : (
                  "Confirm Mock Payment"
                )}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-20 md:hidden" />
    </main>
  )
}
