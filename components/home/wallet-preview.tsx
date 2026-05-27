"use client"

import { motion } from "framer-motion"
import { Plus, ArrowRight, QrCode, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const recentTransactions = [
  { id: 1, type: "credit", description: "Wallet Top-up", amount: 500, date: "Today" },
  { id: 2, type: "debit", description: "Lunch - Biryani", amount: 150, date: "Today" },
  { id: 3, type: "debit", description: "Coffee", amount: 40, date: "Yesterday" },
]

export function WalletPreview() {
  const walletBalance = 1250

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Digital Wallet</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 text-balance">
                Campus Canteen Wallet
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md text-pretty">
                Add money once, pay instantly. No more fumbling for cash or waiting in queues.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full gap-2">
                <Plus className="w-5 h-5" />
                Add Money
              </Button>
              <Button variant="outline" size="lg" className="rounded-full gap-2">
                View History
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">QR Payments</h4>
                  <p className="text-sm text-muted-foreground">Scan & pay instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Easy Top-up</h4>
                  <p className="text-sm text-muted-foreground">UPI, Cards, NetBanking</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Wallet Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Wallet Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-primary via-primary to-orange-600 rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-2xl overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <span className="font-semibold">Campus Canteen</span>
                  </div>
                  <QrCode className="w-8 h-8 opacity-80" />
                </div>

                {/* Balance */}
                <div className="mb-8">
                  <p className="text-sm opacity-80 mb-1">Available Balance</p>
                  <p className="text-4xl sm:text-5xl font-bold">₹{walletBalance.toLocaleString()}</p>
                </div>

                {/* User Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Student ID</p>
                    <p className="font-medium">STU-2024-001</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Money
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Recent Transactions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="absolute -bottom-6 -right-6 sm:right-auto sm:-left-6 w-64 bg-card rounded-2xl p-4 shadow-xl border border-border"
            >
              <h4 className="font-semibold text-foreground text-sm mb-3">Recent Activity</h4>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === "credit" ? "bg-success/10" : "bg-muted"
                      }`}>
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-success" : "text-foreground"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
