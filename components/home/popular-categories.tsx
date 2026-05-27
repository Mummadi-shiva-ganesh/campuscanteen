"use client"

import { motion } from "framer-motion"

const categories = [
  { name: "Breakfast", icon: "🍳", items: 12, color: "from-amber-100 to-orange-100" },
  { name: "Lunch", icon: "🍛", items: 25, color: "from-red-100 to-orange-100" },
  { name: "Snacks", icon: "🍟", items: 18, color: "from-yellow-100 to-amber-100" },
  { name: "Beverages", icon: "🧋", items: 15, color: "from-green-100 to-teal-100" },
  { name: "Desserts", icon: "🍰", items: 10, color: "from-pink-100 to-rose-100" },
  { name: "Healthy", icon: "🥗", items: 8, color: "from-emerald-100 to-green-100" },
]

export function PopularCategories() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Explore</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">Popular Categories</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Browse through our diverse menu categories
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
              >
                <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 text-center border border-border/50 hover:shadow-lg transition-shadow duration-300`}>
                  <motion.span 
                    className="text-5xl block mb-3"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {category.icon}
                  </motion.span>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{category.items} items</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
