"use client"

import { motion } from "framer-motion"
import { Star, Clock, Plus, Leaf, Drumstick } from "lucide-react"
import { Button } from "@/components/ui/button"

const specials = [
  {
    id: 1,
    name: "Butter Chicken",
    price: 180,
    originalPrice: 220,
    rating: 4.9,
    prepTime: "20 min",
    isVeg: false,
    image: "🍗",
    tag: "Bestseller",
  },
  {
    id: 2,
    name: "Paneer Tikka Masala",
    price: 150,
    originalPrice: 180,
    rating: 4.8,
    prepTime: "15 min",
    isVeg: true,
    image: "🧀",
    tag: "Popular",
  },
  {
    id: 3,
    name: "Veg Biryani",
    price: 120,
    originalPrice: 140,
    rating: 4.7,
    prepTime: "18 min",
    isVeg: true,
    image: "🍚",
    tag: "New",
  },
  {
    id: 4,
    name: "Chicken Fried Rice",
    price: 130,
    originalPrice: 150,
    rating: 4.6,
    prepTime: "12 min",
    isVeg: false,
    image: "🍜",
    tag: null,
  },
]

export function TodaysSpecials() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Fresh & Hot</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">{"Today's Specials"}</h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Handpicked dishes prepared fresh daily by our expert chefs
            </p>
          </div>
          <Button variant="outline" className="rounded-full w-fit">
            View All Specials
          </Button>
        </motion.div>

        {/* Food Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group"
              >
                {/* Image Area */}
                <div className="relative h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                  <motion.span 
                    className="text-6xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.image}
                  </motion.span>
                  
                  {/* Tag */}
                  {item.tag && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      {item.tag}
                    </span>
                  )}
                  
                  {/* Veg/Non-Veg Badge */}
                  <span className={`absolute top-3 right-3 p-1.5 rounded-md ${item.isVeg ? "bg-success/10" : "bg-destructive/10"}`}>
                    {item.isVeg ? (
                      <Leaf className="w-4 h-4 text-success" />
                    ) : (
                      <Drumstick className="w-4 h-4 text-destructive" />
                    )}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                  
                  {/* Rating & Time */}
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {item.prepTime}
                    </span>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">₹{item.price}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{item.originalPrice}</span>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button size="sm" className="rounded-full w-9 h-9 p-0">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
