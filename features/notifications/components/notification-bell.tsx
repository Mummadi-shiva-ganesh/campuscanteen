"use client"

import { useEffect } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/actions"
import { useAuthStore } from "@/features/auth/store"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()

  // 1. Query notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    enabled: !!profile,
  })

  // 2. Realtime listener setup
  useEffect(() => {
    if (!profile) return

    const supabase = createClient()
    const channelName = `user-notifications-${profile.id}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: any) => {
          // Play a gentle notification sound if possible
          try {
            const audio = new Audio("/notification.mp3")
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch (e) {}

          // Show a fresh sonner toast
          toast.success(`${payload.new.title}`, {
            description: payload.new.message,
            duration: 5000,
          })

          // Invalidate React Query caches so all pages refresh their data
          queryClient.invalidateQueries({ queryKey: ["notifications"] })
          queryClient.invalidateQueries({ queryKey: ["orders"] })
          queryClient.invalidateQueries({ queryKey: ["walletTransactions"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, queryClient])

  // 3. Mutations
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("All notifications marked as read")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark notifications as read")
    },
  })

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update notification")
    },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  if (!profile) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors focus:outline-none">
          <Bell className="w-5 h-5 text-secondary-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-card border-border rounded-2xl shadow-xl mt-2 z-50 p-2" align="end">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="font-semibold text-foreground text-sm">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                {unreadCount} new
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs h-7 px-2 hover:bg-muted text-primary hover:text-primary/80 font-medium"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Mark all read"
              )}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-1" />
        
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    markSingleReadMutation.mutate(notification.id)
                  }
                }}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors cursor-pointer focus:bg-muted ${
                  !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold text-foreground ${!notification.read ? "font-bold" : ""}`}>
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">No notifications yet</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
