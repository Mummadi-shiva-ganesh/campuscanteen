"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useCartStore } from "@/features/cart/store"
import { toast } from "sonner"

export default function CartPage() {
  const { items: cartItems, addItem, removeItem, updateQuantity, getTotals } = useCartStore()
  const { subtotal, tax: rawTax, packaging, count } = getTotals()
  
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100 // 5% GST on discounted subtotal
  const total = Math.round((subtotal - discount + tax + packaging) * 100) / 100

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "CAMPUS10") {
      setPromoApplied(true)
      toast.success("Promo code CAMPUS10 applied!")
    } else {
      toast.error("Invalid promo code")
    }
  }

  const handleRemoveItem = (id: string) => {
    updateQuantity(id, 0)
    toast.success("Item removed from cart")
  }

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
            <Link href="/menu">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Cart</h1>
              <p className="text-muted-foreground">{count} items</p>
            </div>
          </motion.div>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center shrink-0">
                          {item.image_url && item.image_url.length < 5 ? (
                            <span className="text-4xl">{item.image_url}</span>
                          ) : (
                            <span className="text-4xl">🍛</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`w-3 h-3 rounded-sm ${item.is_veg ? "border-2 border-success" : "border-2 border-destructive"}`}>
                                  <span className={`block w-1.5 h-1.5 rounded-full m-0.5 ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {item.is_veg ? "Veg" : "Non-Veg"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-foreground">
                              ₹{item.price * item.quantity}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors text-foreground"
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>
                              <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addItem({ ...item })}
                                className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors text-foreground"
                              >
                                <Plus className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Promo Code */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">Apply Promo Code</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="rounded-xl"
                      disabled={promoApplied}
                    />
                    <Button
                      onClick={applyPromo}
                      variant={promoApplied ? "secondary" : "default"}
                      className="rounded-xl px-6"
                      disabled={promoApplied || !promoCode}
                    >
                      {promoApplied ? "Applied!" : "Apply"}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-sm text-success mt-2">CAMPUS10 applied - 10% off!</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Try: CAMPUS10 for 10% off</p>
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:sticky lg:top-28 h-fit"
              >
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-semibold text-lg text-foreground mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">₹{subtotal}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-success">
                        <span>Discount (10%)</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
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

                  <Link href={`/payment?total=${total}`}>
                    <Button className="w-full mt-6 h-12 rounded-xl text-base">
                      Proceed to Payment
                    </Button>
                  </Link>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Estimated prep time: 15-20 mins
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Empty Cart */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some delicious items to get started</p>
              <Link href="/menu">
                <Button className="rounded-full px-8">Browse Menu</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 md:hidden left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-35">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">₹{total}</span>
          </div>
          <Link href={`/payment?total=${total}`}>
            <Button className="w-full h-12 rounded-xl text-base">
              Proceed to Payment
            </Button>
          </Link>
        </div>
      )}

      <div className="h-20 md:hidden" />
    </main>
  )
}
