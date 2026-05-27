"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChefHat, Instagram, Twitter, Facebook, Mail, Phone, MapPin } from "lucide-react"

const footerLinks = {
  product: [
    { name: "Menu", href: "/menu" },
    { name: "Today's Specials", href: "/menu" },
    { name: "Wallet", href: "/wallet" },
    { name: "Orders", href: "/orders" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Blog", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "FAQs", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">
                Campus<span className="text-primary">Canteen</span>
              </span>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-sm">
              Skip queues. Order instantly. Pay digitally. The modern way to enjoy campus meals.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Main Campus, Block A</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@canteen.edu</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Campus Canteen. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.support.slice(2).map((link) => (
              <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
