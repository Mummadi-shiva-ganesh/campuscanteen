"use client"

import { motion } from "framer-motion"
import { ArrowRight, Clock, Star, Sparkles, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const floatingFoodItems = [
  { name: "Paneer Butter Masala", price: "₹120", rating: "4.8", time: "15 min", top: "10%", right: "5%", delay: 0 },
  { name: "Chicken Biryani", price: "₹150", rating: "4.9", time: "20 min", top: "35%", right: "0%", delay: 0.2 },
  { name: "Masala Dosa", price: "₹60", rating: "4.7", time: "10 min", top: "60%", right: "8%", delay: 0.4 },
]

const stats = [
  { value: "10K+", label: "Happy Students" },
  { value: "50+", label: "Menu Items" },
  { value: "5 min", label: "Avg Wait Time" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm font-medium text-success">Open Now</span>
              <span className="text-sm text-muted-foreground">• Closes at 10 PM</span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance"
              >
                Campus Meals,{" "}
                <span className="text-primary">Reimagined.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-muted-foreground max-w-lg text-pretty"
              >
                Skip queues. Order instantly. Pay digitally. Collect with QR.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/menu">
                <Button size="lg" className="rounded-full px-8 text-base h-12 gap-2 group">
                  Order Food
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
                  Explore Menu
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>100% Hygienic</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Fresh Ingredients</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>Quick Prep Time</span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-8 pt-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Floating Food Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative h-[500px] lg:h-[600px] hidden lg:block"
          >
            {/* Main Food Image Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="text-8xl"
                >
                  🍛
                </motion.div>
              </div>
            </div>

            {/* Floating Food Cards */}
            {floatingFoodItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + item.delay }}
                style={{ top: item.top, right: item.right }}
                className="absolute"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                  className="bg-card rounded-2xl p-4 shadow-xl border border-border min-w-[180px]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                      {index === 0 ? "🍛" : index === 1 ? "🍗" : "🥘"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
                      <p className="text-primary font-bold">{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Live Activity Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-0"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="bg-card rounded-2xl p-4 shadow-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">12 orders</p>
                    <p className="text-xs text-muted-foreground">Being prepared now</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
