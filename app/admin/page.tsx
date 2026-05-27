"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  ChefHat,
  X,
  Menu,
  Home,
  ClipboardList,
  UtensilsCrossed,
  Wallet,
  Settings,
  Bell,
  Search,
  CheckCircle,
  AlertCircle,
  Package,
  Plus,
  Edit,
  Trash2,
  Camera,
  Check,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllOrders, updateOrderStatus } from "@/features/orders/actions"
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability, toggleItemSpecial } from "@/features/menu/actions"
import { getAllWalletTransactions, getPaymentSettings, updatePaymentSettings } from "@/features/wallet/actions"
import { createClient } from "@/lib/supabase/client"
import QRScanner from "@/features/admin/components/qr-scanner"
import { toast } from "sonner"

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "menu" | "transactions" | "settings">("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  
  // Search & Filter States
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [orderFilter, setOrderFilter] = useState<"all" | "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled">("all")
  
  // Menu Manager Modal States
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null)
  
  // Menu Form Inputs
  const [menuName, setMenuName] = useState("")
  const [menuDescription, setMenuDescription] = useState("")
  const [menuPrice, setMenuPrice] = useState("")
  const [menuImageUrl, setMenuImageUrl] = useState("")
  const [menuCategory, setMenuCategory] = useState("lunch")
  const [menuPrepTime, setMenuPrepTime] = useState("15 min")
  const [menuIsVeg, setMenuIsVeg] = useState(true)
  const [menuIsSpecial, setMenuIsSpecial] = useState(false)

  // Settings States
  const [settingsId, setSettingsId] = useState("")
  const [upiId, setUpiId] = useState("canteen@upi")
  const [merchantName, setMerchantName] = useState("Campus Canteen")

  // --- REACT QUERY FETCHING ---

  // 1. Fetch Orders
  const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => getAllOrders(),
  })

  // 2. Fetch Menu Items
  const { data: menuItems = [], isLoading: loadingMenu, refetch: refetchMenu } = useQuery({
    queryKey: ["adminMenuItems"],
    queryFn: () => getMenuItems(),
  })

  // 3. Fetch Wallet Transactions
  const { data: transactions = [], refetch: refetchTransactions } = useQuery({
    queryKey: ["adminTransactions"],
    queryFn: () => getAllWalletTransactions(),
  })

  // 4. Fetch Payment Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPaymentSettings()
        if (data) {
          setSettingsId(data.id)
          setUpiId(data.upi_id)
          setMerchantName(data.merchant_name)
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err.message)
      }
    }
    fetchSettings()
  }, [])

  // --- REALTIME SUBSCRIBER ---
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to all changes in orders, transactions, and menu
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] })
        toast.info("Order list updated in real-time.")
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wallet_transactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["adminTransactions"] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // --- MUTATIONS ---

  // Update Order Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: any }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] })
      toast.success("Order status updated successfully.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order status.")
    }
  })

  // Toggle Availability Mutation
  const toggleAvailableMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => toggleItemAvailability(id, available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMenuItems"] })
      toast.success("Item availability updated.")
    }
  })

  // Toggle Special Mutation
  const toggleSpecialMutation = useMutation({
    mutationFn: ({ id, isSpecial }: { id: string; isSpecial: boolean }) => toggleItemSpecial(id, isSpecial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMenuItems"] })
      toast.success("Item special tag updated.")
    }
  })

  // Delete Menu Item Mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMenuItems"] })
      toast.success("Menu item deleted.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not delete item.")
    }
  })

  // Update Settings handler
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updatePaymentSettings(settingsId, upiId, merchantName)
      toast.success("UPI Merchant Settings updated successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment settings.")
    }
  }

  // Handle Add/Edit Menu Submission
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = parseFloat(menuPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price.")
      return
    }

    const payload = {
      name: menuName,
      description: menuDescription,
      imageUrl: menuImageUrl || "🍛", // fallback emoji
      category: menuCategory,
      price: priceNum,
      prepTime: menuPrepTime,
      isVeg: menuIsVeg,
      isSpecial: menuIsSpecial,
      available: true,
    }

    try {
      if (editingMenuItem) {
        await updateMenuItem(editingMenuItem.id, payload)
        toast.success(`Menu item "${menuName}" updated successfully!`)
      } else {
        await createMenuItem(payload)
        toast.success(`Menu item "${menuName}" created successfully!`)
      }
      setIsMenuModalOpen(false)
      setEditingMenuItem(null)
      queryClient.invalidateQueries({ queryKey: ["adminMenuItems"] })
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu item.")
    }
  }

  const openEditMenu = (item: any) => {
    setEditingMenuItem(item)
    setMenuName(item.name)
    setMenuDescription(item.description || "")
    setMenuPrice(item.price.toString())
    setMenuImageUrl(item.image_url || "")
    setMenuCategory(item.category)
    setMenuPrepTime(item.prep_time || "15 min")
    setMenuIsVeg(item.is_veg)
    setMenuIsSpecial(item.is_special)
    setIsMenuModalOpen(true)
  }

  const openAddMenu = () => {
    setEditingMenuItem(null)
    setMenuName("")
    setMenuDescription("")
    setMenuPrice("")
    setMenuImageUrl("")
    setMenuCategory("lunch")
    setMenuPrepTime("15 min")
    setMenuIsVeg(true)
    setMenuIsSpecial(false)
    setIsMenuModalOpen(true)
  }

  // --- METRIC MATH CALCULATIONS ---
  const today = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
  
  const todayRevenue = todayOrders
    .filter(o => o.payment_status === "paid" && o.order_status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount), 0)
    
  const totalOrdersCount = todayOrders.length
  
  const activeUsersCount = new Set(orders.map(o => o.user_id)).size
  
  const avgPrepTime = orders.length > 0
    ? Math.round(orders.reduce((sum, o) => sum + (o.preparation_time || 15), 0) / orders.length)
    : 12

  // Active Pending/Preparing orders for sidebar badge
  const pendingOrdersCount = orders.filter(o => o.order_status === "Pending" || o.order_status === "Preparing").length

  // Filtered Orders for the Orders Tab
  const filteredOrders = orders.filter(order => {
    const orderIdString = order.booking_id || ""
    const customerName = order.users?.full_name || ""
    const matchesSearch = 
      orderIdString.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(orderSearchQuery.toLowerCase())
      
    const matchesFilter = orderFilter === "all" || order.order_status === orderFilter
    return matchesSearch && matchesFilter
  })

  // Dynamic Popular Items calculator
  const dynamicTopItems = () => {
    const countMap = new Map<string, { count: number; revenue: number }>()
    orders.forEach(order => {
      if (order.order_status === "Cancelled") return
      order.order_items?.forEach((item: any) => {
        const name = item.menu_items?.name || "Unknown Item"
        const stats = countMap.get(name) || { count: 0, revenue: 0 }
        countMap.set(name, {
          count: stats.count + item.quantity,
          revenue: stats.revenue + (Number(item.price) * item.quantity)
        })
      })
    })

    return Array.from(countMap.entries())
      .map(([name, stat]) => ({ name, orders: stat.count, revenue: stat.revenue }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
  }

  const sidebarLinks = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "orders", label: "Orders", icon: ClipboardList, badge: pendingOrdersCount },
    { id: "menu", label: "Menu CRUD", icon: UtensilsCrossed },
    { id: "transactions", label: "Valute Logs", icon: Wallet },
    { id: "settings", label: "UPI Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Campus<span className="text-primary">Canteen</span>
            </span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === link.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${
                  activeTab === link.id ? "bg-primary-foreground/20 text-white" : "bg-primary text-primary-foreground"
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-muted rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-foreground">Admin Portal</p>
            <p className="text-xs text-muted-foreground mt-1">Canteen Operations Manager</p>
            <Link href="/" className="block mt-3">
              <Button variant="outline" size="sm" className="w-full rounded-lg">
                View Customer Site
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Canteen Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <nav className="px-4 space-y-1">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id as any)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === link.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-foreground capitalize">
                {activeTab === "menu" ? "Menu CRUD Manager" : activeTab === "transactions" ? "Valute Transaction Log" : activeTab === "settings" ? "UPI Merchant settings" : activeTab}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsScannerOpen(true)}
                className="rounded-xl gap-2 font-semibold bg-gradient-to-r from-primary to-orange-600 hover:shadow-lg transition-shadow"
              >
                <Camera className="w-5 h-5" />
                <span>Scan QR Ticket</span>
              </Button>
              
              <button 
                onClick={() => {
                  refetchOrders()
                  refetchMenu()
                  refetchTransactions()
                  toast.success("Data reloaded.")
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Contents */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-1">₹{todayRevenue}</p>
                    <div className="flex items-center gap-1 mt-2 text-success">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Live sync</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Orders</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalOrdersCount}</p>
                    <div className="flex items-center gap-1 mt-2 text-primary">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="text-sm font-medium">Orders placed</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{activeUsersCount}</p>
                    <div className="flex items-center gap-1 mt-2 text-blue-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Total ordering</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg prep time</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{avgPrepTime} min</p>
                    <div className="flex items-center gap-1 mt-2 text-purple-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Estimated</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Sub-grid: Recent Orders & Top Items */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Recent Activity</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")} className="text-primary hover:text-orange-600">
                      View All Orders
                    </Button>
                  </div>
                  
                  {loadingOrders ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading orders...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No orders placed today.
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                order.order_status === "Pending" ? "bg-amber-100 text-amber-600" :
                                order.order_status === "Preparing" ? "bg-primary/10 text-primary" :
                                order.order_status === "Ready" ? "bg-success/10 text-success" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {order.order_status === "Pending" ? <Clock className="w-5 h-5" /> :
                                 order.order_status === "Preparing" ? <ChefHat className="w-5 h-5" /> :
                                 order.order_status === "Ready" ? <Package className="w-5 h-5" /> :
                                 <CheckCircle className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground font-mono">{order.booking_id}</span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">• {order.users?.full_name || "Guest Student"}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {order.order_items?.map((i: any) => `${i.menu_items?.name} x${i.quantity}`).join(", ")}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                order.order_status === "Pending" ? "bg-amber-100 text-amber-700" :
                                order.order_status === "Preparing" ? "bg-primary/10 text-primary" :
                                order.order_status === "Ready" ? "bg-success/10 text-success" :
                                order.order_status === "Completed" ? "bg-muted text-muted-foreground" :
                                "bg-destructive/10 text-destructive"
                              }`}>
                                {order.order_status}
                              </span>
                              <span className="font-bold text-sm text-foreground">₹{order.total_amount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Selling Items */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Popular Meals</h3>
                    <p className="text-xs text-muted-foreground mb-4">Best sellers by volume ordered</p>
                    
                    <div className="space-y-4">
                      {dynamicTopItems().length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No orders compiled yet.</p>
                      ) : (
                        dynamicTopItems().map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                            }`}>
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.orders} units</p>
                            </div>
                            <span className="font-bold text-sm text-foreground">₹{item.revenue}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => setActiveTab("menu")} className="mt-6 w-full rounded-xl gap-2 text-xs">
                    <UtensilsCrossed className="w-4 h-4" />
                    Manage Menu Offerings
                  </Button>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Quick Canteen Operations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button variant="outline" onClick={openAddMenu} className="h-auto py-4 flex-col gap-2 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                    <span className="font-semibold">Add Menu Item</span>
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("orders")} className="h-auto py-4 flex-col gap-2 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <ClipboardList className="w-6 h-6 text-orange-500" />
                    <span className="font-semibold">Active Orders</span>
                  </Button>
                  <Button variant="outline" onClick={() => setIsScannerOpen(true)} className="h-auto py-4 flex-col gap-2 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera className="w-6 h-6 text-green-500 animate-bounce" />
                    <span className="font-semibold">Scan QR Verification</span>
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("settings")} className="h-auto py-4 flex-col gap-2 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Settings className="w-6 h-6 text-blue-500" />
                    <span className="font-semibold">Edit Payment Settings</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS LIST */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order booking ID or student..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-card border border-border"
                  />
                </div>
                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {["all", "Pending", "Preparing", "Ready", "Completed", "Cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        orderFilter === status
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-card border border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {status === "all" ? "All Orders" : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {loadingOrders ? (
                  <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span>Retrieving database orders...</span>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-16 text-center text-muted-foreground">
                    No orders match your filter criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-muted/40 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-lg text-foreground bg-muted px-2 py-0.5 rounded border">
                                {order.booking_id}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                order.order_status === "Pending" ? "bg-amber-100 text-amber-700" :
                                order.order_status === "Preparing" ? "bg-primary/10 text-primary" :
                                order.order_status === "Ready" ? "bg-success/10 text-success" :
                                order.order_status === "Completed" ? "bg-muted text-muted-foreground" :
                                "bg-destructive/10 text-destructive"
                              }`}>
                                {order.order_status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            
                            <div className="text-sm font-semibold text-foreground">
                              {order.users?.full_name || "Guest Student"} • <span className="text-muted-foreground font-medium font-mono text-xs">{order.users?.roll_number || "No roll num"}</span>
                            </div>

                            <div className="text-sm bg-muted/50 p-3 rounded-xl border max-w-xl">
                              <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Items Summary</p>
                              <div className="space-y-1">
                                {order.order_items?.map((item: any) => (
                                  <div key={item.id} className="text-xs text-foreground flex justify-between">
                                    <span>{item.menu_items?.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                                    <span className="font-medium">₹{Number(item.price) * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between self-stretch gap-4 shrink-0 text-right">
                            <div>
                              <p className="text-lg font-bold text-foreground">₹{order.total_amount}</p>
                              <p className="text-xs text-muted-foreground">Via {order.payment_method.toUpperCase()} ({order.payment_status})</p>
                            </div>

                            {/* Status Control Actions */}
                            <div className="flex gap-2">
                              {order.order_status === "Pending" && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "Preparing" })}
                                  className="rounded-lg h-9 bg-primary hover:bg-primary/95 text-white"
                                >
                                  Start Prep
                                </Button>
                              )}
                              {order.order_status === "Preparing" && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "Ready" })}
                                  className="rounded-lg h-9 bg-success hover:bg-success/90 text-white"
                                >
                                  Mark Ready
                                </Button>
                              )}
                              {order.order_status === "Ready" && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "Completed" })}
                                  className="rounded-lg h-9 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Complete Pickup
                                </Button>
                              )}
                              
                              {(order.order_status === "Pending" || order.order_status === "Preparing" || order.order_status === "Ready") && (
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if(confirm(`Cancel order ${order.booking_id}? Wallet payments will be automatically refunded.`)) {
                                      updateStatusMutation.mutate({ orderId: order.id, status: "Cancelled" })
                                    }
                                  }}
                                  className="rounded-lg h-9 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MENU CRUD */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Manage active dishes, prices, and settings.</p>
                <Button onClick={openAddMenu} className="rounded-xl gap-2 font-semibold">
                  <Plus className="w-5 h-5" />
                  <span>Create Menu Item</span>
                </Button>
              </div>

              {loadingMenu ? (
                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <span>Loading menu items...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{item.image_url && item.image_url.length < 5 ? item.image_url : "🍛"}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.is_veg ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {item.is_veg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-base">{item.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-base font-extrabold text-foreground">₹{item.price}</span>
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">{item.category}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border space-y-3">
                        {/* Status Toggles */}
                        <div className="flex justify-between text-xs">
                          <label className="flex items-center gap-2 text-muted-foreground">
                            <input 
                              type="checkbox" 
                              checked={item.available}
                              onChange={(e) => toggleAvailableMutation.mutate({ id: item.id, available: e.target.checked })}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                            />
                            Available
                          </label>
                          
                          <label className="flex items-center gap-2 text-muted-foreground">
                            <input 
                              type="checkbox" 
                              checked={item.is_special}
                              onChange={(e) => toggleSpecialMutation.mutate({ id: item.id, isSpecial: e.target.checked })}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                            />
                            Today's Special
                          </label>
                        </div>

                        {/* Edit / Delete Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditMenu(item)}
                            className="flex-1 rounded-lg gap-1 text-xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => {
                              if (confirm(`Delete menu item "${item.name}"?`)) {
                                deleteMenuItemMutation.mutate(item.id)
                              }
                            }}
                            className="flex-1 rounded-lg gap-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTIONS VALUTE LOGS */}
          {activeTab === "transactions" && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <p className="text-sm text-muted-foreground">Review recharge top-ups and order debits across the campus.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground uppercase">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No transactions found.</td>
                      </tr>
                    ) : (
                      transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-muted/30">
                          <td className="p-4">
                            <p className="font-semibold text-foreground">{tx.users?.full_name || "Student"}</p>
                            <p className="text-xs text-muted-foreground">{tx.users?.email}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              tx.type === "credit" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {tx.type === "credit" ? "Deposit" : "Debit"}
                            </span>
                          </td>
                          <td className={`p-4 font-bold ${tx.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                            {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                          </td>
                          <td className="p-4 text-muted-foreground">{tx.description}</td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm max-w-xl mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">UPI Configuration</h3>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Canteen UPI ID</label>
                  <Input 
                    type="text" 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)} 
                    placeholder="e.g. canteen@okaxis"
                    required
                    className="rounded-xl h-11"
                  />
                  <p className="text-xs text-muted-foreground">Scanned payments will flow into this virtual payment address (VPA).</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Merchant / Business Name</label>
                  <Input 
                    type="text" 
                    value={merchantName} 
                    onChange={(e) => setMerchantName(e.target.value)} 
                    placeholder="e.g. Campus Canteen Main"
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl font-semibold mt-4">
                  Save Payment Settings
                </Button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* --- ADD/EDIT MENU ITEM DRAWER/MODAL --- */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuModalOpen(false)}
              className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-md w-full relative shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">
                  {editingMenuItem ? `Edit: ${editingMenuItem.name}` : "Create New Dish"}
                </h3>
                <button 
                  onClick={() => setIsMenuModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleMenuSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dish Name</label>
                  <Input 
                    value={menuName} 
                    onChange={(e) => setMenuName(e.target.value)} 
                    placeholder="e.g. Butter Chicken" 
                    required 
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                  <textarea 
                    value={menuDescription} 
                    onChange={(e) => setMenuDescription(e.target.value)} 
                    placeholder="Rich creamy tomato curry..." 
                    required 
                    rows={2}
                    className="w-full border border-border bg-background rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Price (₹)</label>
                    <Input 
                      type="number"
                      value={menuPrice} 
                      onChange={(e) => setMenuPrice(e.target.value)} 
                      placeholder="150" 
                      required 
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Prep Time</label>
                    <Input 
                      value={menuPrepTime} 
                      onChange={(e) => setMenuPrepTime(e.target.value)} 
                      placeholder="15 min" 
                      required 
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                    <select 
                      value={menuCategory} 
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className="w-full h-10 border border-border bg-background rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snacks">Snacks</option>
                      <option value="beverages">Beverages</option>
                      <option value="desserts">Desserts</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Icon / Emoji</label>
                    <Input 
                      value={menuImageUrl} 
                      onChange={(e) => setMenuImageUrl(e.target.value)} 
                      placeholder="e.g. 🍛, 🍗 or Image URL" 
                      required 
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={menuIsVeg} 
                      onChange={(e) => setMenuIsVeg(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    Is vegetarian (Veg)
                  </label>

                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={menuIsSpecial} 
                      onChange={(e) => setMenuIsSpecial(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    Featured Special
                  </label>
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl font-bold mt-4">
                  {editingMenuItem ? "Save Changes" : "Create Item"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CAMERA QR SCANNER DRAWER/MODAL --- */}
      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={() => {
          // Refetch orders to update the status in the UI automatically
          queryClient.invalidateQueries({ queryKey: ["adminOrders"] })
        }}
      />

    </div>
  )
}
