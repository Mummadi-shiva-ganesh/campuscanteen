"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Star, Clock, Plus, Minus, Leaf, Drumstick, ShoppingCart, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getMenuItems } from "@/features/menu/actions"
import { useCartStore } from "@/features/cart/store"

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [showVegOnly, setShowVegOnly] = useState(false)

  // Zustand Cart Store
  const { items: cartItems, addItem, removeItem, getTotals } = useCartStore()
  const { total: cartTotal, count: cartItemCount } = getTotals()

  // Fetch menu items from Supabase PostgreSQL database
  const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => getMenuItems(),
  })

  // Dynamic Categories calculation based on database records
  const categories = [
    { id: "all", name: "All", count: menuItems.length },
    { id: "breakfast", name: "Breakfast", count: menuItems.filter((i) => i.category === "breakfast").length },
    { id: "lunch", name: "Lunch", count: menuItems.filter((i) => i.category === "lunch").length },
    { id: "snacks", name: "Snacks", count: menuItems.filter((i) => i.category === "snacks").length },
    { id: "beverages", name: "Beverages", count: menuItems.filter((i) => i.category === "beverages").length },
    { id: "desserts", name: "Desserts", count: menuItems.filter((i) => i.category === "desserts").length },
  ]

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || item.category === activeCategory
    const matchesVeg = !showVegOnly || item.is_veg
    const isAvailable = item.available
    return matchesSearch && matchesCategory && matchesVeg && isAvailable
  })

  const getCartQty = (id: string) => {
    return cartItems.find((i) => i.id === id)?.quantity || 0
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-28 pb-32 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Our Menu</h1>
            <p className="text-muted-foreground mt-2">Explore our delicious offerings</p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sticky top-20 z-30 bg-background/95 backdrop-blur-lg py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-border"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted border-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Veg Filter */}
              <Button
                variant={showVegOnly ? "default" : "outline"}
                onClick={() => setShowVegOnly(!showVegOnly)}
                className="rounded-xl h-12 gap-2"
              >
                <Leaf className="w-4 h-4" />
                Veg Only
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category.name}
                  <span className="ml-1 text-xs opacity-70">({category.count})</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading freshly prepared menu...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-20 bg-destructive/5 rounded-3xl border border-destructive/10 max-w-lg mx-auto">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-lg font-semibold text-foreground mt-3">Failed to load Menu</h3>
              <p className="text-sm text-muted-foreground mt-1">Check your database connections.</p>
            </div>
          )}

          {/* Menu Grid */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => {
                  const qty = getCartQty(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                      >
                        {/* Image representation (checks if it's emoji or actual URL) */}
                        <div className="relative h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                          {item.image_url && item.image_url.length < 5 ? (
                            <span className="text-6xl">{item.image_url}</span>
                          ) : (
                            <span className="text-6xl">🍛</span>
                          )}
                          
                          {item.is_special && (
                            <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                              Today's Special
                            </span>
                          )}
                          
                          <span className={`absolute top-3 right-3 p-1.5 rounded-md ${item.is_veg ? "bg-success/10" : "bg-destructive/10"}`}>
                            {item.is_veg ? (
                              <Leaf className="w-4 h-4 text-success" />
                            ) : (
                              <Drumstick className="w-4 h-4 text-destructive" />
                            )}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          
                          {/* Rating & Time */}
                          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {item.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {item.prep_time}
                            </span>
                          </div>

                          {/* Price & Add Button */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-foreground">₹{item.price}</span>
                            </div>
                            
                            {qty > 0 ? (
                              <div className="flex items-center gap-2 bg-primary rounded-full p-1">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeItem(item.id)}
                                  className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30"
                                >
                                  <Minus className="w-4 h-4" />
                                </motion.button>
                                <span className="w-6 text-center text-primary-foreground font-semibold">
                                  {qty}
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addItem({
                                    id: item.id,
                                    name: item.name,
                                    price: Number(item.price),
                                    image_url: item.image_url,
                                    category: item.category,
                                    is_veg: item.is_veg
                                  })}
                                  className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30"
                                >
                                  <Plus className="w-4 h-4" />
                                </motion.button>
                              </div>
                            ) : (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  onClick={() => addItem({
                                    id: item.id,
                                    name: item.name,
                                    price: Number(item.price),
                                    image_url: item.image_url,
                                    category: item.category,
                                    is_veg: item.is_veg
                                  })}
                                  className="rounded-full"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-foreground">No items found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => {
                  setSearchQuery("")
                  setActiveCategory("all")
                  setShowVegOnly(false)
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-40"
          >
            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 md:min-w-[320px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{cartItemCount} items</p>
                    <p className="text-sm opacity-80">₹{cartTotal}</p>
                  </div>
                </div>
                <Button variant="secondary" className="rounded-xl">
                  View Cart
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <div className="h-20 md:hidden" />
    </main>
  )
}
