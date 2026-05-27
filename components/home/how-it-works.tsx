"use client"

import { motion } from "framer-motion"
import { QrCode, UtensilsCrossed, CreditCard, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: QrCode,
    title: "Scan QR",
    description: "Scan the table QR code to start ordering",
    color: "from-blue-500/20 to-blue-600/20",
    iconColor: "text-blue-500",
  },
  {
    icon: UtensilsCrossed,
    title: "Browse Meals",
    description: "Explore our menu and add your favorites",
    color: "from-primary/20 to-orange-600/20",
    iconColor: "text-primary",
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    description: "Pay with wallet, UPI, or card instantly",
    color: "from-purple-500/20 to-purple-600/20",
    iconColor: "text-purple-500",
  },
  {
    icon: CheckCircle,
    title: "Collect with QR",
    description: "Show your QR code and collect your meal",
    color: "from-success/20 to-green-600/20",
    iconColor: "text-success",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">How It Works</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Order your favorite campus meals in just 4 simple steps
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>

                {/* Connector Line (not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
