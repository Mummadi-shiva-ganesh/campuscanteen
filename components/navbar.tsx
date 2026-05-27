"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Menu, X, Home, UtensilsCrossed, ClipboardList, Wallet, ChefHat, Shield, LogOut, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store"
import { useCartStore } from "@/features/cart/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/features/notifications/components/notification-bell"

const baseNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
]

export function Navbar() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState("/")

  // State stores
  const { profile, signOut, initialize } = useAuthStore()
  const { getTotals } = useCartStore()
  const { count: cartItemCount } = getTotals()

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Build navigation links dynamically based on user role
  const navLinks = [...baseNavLinks]
  if (profile) {
    navLinks.push({ href: "/orders", label: "Orders", icon: ClipboardList })
    navLinks.push({ href: "/wallet", label: "Wallet", icon: Wallet })
    if (profile.role === "admin") {
      navLinks.push({ href: "/admin", label: "Admin", icon: Shield })
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300 ${
          isScrolled ? "top-2" : "top-4"
        }`}
      >
        <nav
          className={`glass rounded-full px-4 py-2.5 flex items-center justify-between shadow-lg transition-all duration-300 ${
            isScrolled ? "shadow-xl" : ""
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"
            >
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="font-semibold text-foreground hidden sm:block text-lg">
              Campus<span className="text-primary">Canteen</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveLink(link.href)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeLink === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Cart Button */}
            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-secondary-foreground" />
                {isMounted && cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center justify-center"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>

            {/* Profile Dropdown Menu */}
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden sm:flex items-center gap-2 p-1.5 pr-3 rounded-full bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <Avatar className="w-7 h-7 bg-primary text-primary-foreground">
                      <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">
                      {profile.full_name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border rounded-2xl shadow-xl mt-2 z-50">
                  <DropdownMenuLabel className="font-normal flex flex-col p-3">
                    <span className="text-sm font-semibold text-foreground">{profile.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                    <span className="text-xs text-primary font-medium mt-1">
                      Valute: ₹{profile.wallet_balance}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2 py-2.5 px-3 cursor-pointer">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span>Wallet Balance</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 py-2.5 px-3 cursor-pointer">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 py-2.5 px-3 cursor-pointer text-primary">
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 py-2.5 px-3 cursor-pointer text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="hidden sm:flex rounded-full">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-lg z-40 md:hidden"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full gap-6"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => {
                      setActiveLink(link.href)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 text-2xl font-medium transition-colors ${
                      activeLink === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <link.icon className="w-6 h-6" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                {profile ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </Button>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="lg" className="rounded-full px-8">
                      Sign In
                    </Button>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-border z-40"
      >
        <nav className="flex items-center justify-around py-2 px-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveLink(link.href)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                  activeLink === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{link.label}</span>
              </motion.div>
            </Link>
          ))}
          <Link href="/cart">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {isMounted && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Cart</span>
            </motion.div>
          </Link>
        </nav>
      </motion.div>
    </>
  )
}
