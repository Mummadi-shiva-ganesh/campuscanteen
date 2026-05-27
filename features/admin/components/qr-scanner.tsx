"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyAndCompleteOrder } from "@/features/orders/actions"
import { toast } from "sonner"

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess?: () => void
}

export default function QRScanner({ isOpen, onClose, onScanSuccess }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [successOrder, setSuccessOrder] = useState<any>(null)
  
  const scannerRef = useRef<any>(null)
  const elementId = "admin-qr-reader"

  useEffect(() => {
    // Only initialize scanner on client side when open
    if (!isOpen) return

    let Html5Qrcode: any = null
    
    import("html5-qrcode")
      .then((module) => {
        Html5Qrcode = module.Html5Qrcode
        startScanner()
      })
      .catch((err) => {
        console.error("Failed to load html5-qrcode module:", err)
        toast.error("Failed to initialize camera scanner.")
      })

    async function startScanner() {
      if (!Html5Qrcode) return
      
      try {
        setVerifying(false)
        setSuccessOrder(null)
        setScanning(true)

        // Ensure target element is mounted
        const container = document.getElementById(elementId)
        if (!container) return

        const html5QrCode = new Html5Qrcode(elementId)
        scannerRef.current = html5QrCode

        const config = { 
          fps: 10, 
          qrbox: { width: 220, height: 220 } 
        }

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          async (decodedText: string) => {
            // Trigger order verification
            await handleVerification(decodedText)
          },
          () => {} // Silent scan error
        )
        setHasPermission(true)
      } catch (err: any) {
        console.error("Camera scanner startup failed:", err)
        setHasPermission(false)
        setScanning(false)
      }
    }

    return () => {
      stopScanner()
    }
  }, [isOpen])

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setScanning(false)
  }

  const handleVerification = async (bookingId: string) => {
    // Prevent duplicate scans
    if (verifying) return
    setVerifying(true)
    
    // Stop camera immediately on detection to avoid double scans
    await stopScanner()

    try {
      toast.loading(`Verifying order ${bookingId}...`, { id: "verify-order" })
      const order = await verifyAndCompleteOrder(bookingId)
      
      setSuccessOrder(order)
      toast.success(`Order ${bookingId} verified & completed!`, { id: "verify-order" })
      
      if (onScanSuccess) {
        onScanSuccess()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify order.", { id: "verify-order" })
      // Restart scanning after showing error
      setVerifying(false)
      // Small timeout to allow camera restart
      setTimeout(() => {
        if (isOpen) {
          import("html5-qrcode").then((module) => {
            const container = document.getElementById(elementId)
            if (container) {
              const html5QrCode = new module.Html5Qrcode(elementId)
              scannerRef.current = html5QrCode
              html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 220, height: 220 } }, 
                (text) => handleVerification(text), 
                () => {}
              ).then(() => setScanning(true)).catch(() => {})
            }
          })
        }
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full relative shadow-2xl space-y-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-bold text-foreground">Order QR Scanner</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Area */}
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
              {/* Scan box indicators */}
              {scanning && (
                <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none z-10">
                  <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-dashed border-primary/60 rounded-xl" />
                  {/* Laser Line */}
                  <motion.div 
                    animate={{ y: [40, 240, 40] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="h-0.5 bg-primary w-[80%] mx-auto shadow-[0_0_10px_#FF6B00]"
                  />
                </div>
              )}

              {/* HTML5 QR target */}
              <div id={elementId} className="w-full h-full object-cover" />

              {/* Status overlays */}
              {hasPermission === false && (
                <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center p-4 text-center space-y-3 z-20">
                  <AlertTriangle className="w-10 h-10 text-destructive animate-bounce" />
                  <p className="text-sm font-semibold text-foreground">Camera Access Denied</p>
                  <p className="text-xs text-muted-foreground">Please grant camera permissions to scan customer booking tickets.</p>
                </div>
              )}

              {verifying && (
                <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 text-center space-y-3 z-20">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-foreground">Verifying Ticket...</p>
                  <p className="text-xs text-muted-foreground">Fetching database records</p>
                </div>
              )}

              {successOrder && (
                <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-4 text-center space-y-3 z-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="w-6 h-6" />
                  </motion.div>
                  <p className="text-sm font-bold text-foreground">Order Handed Over!</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {successOrder.booking_id}
                  </p>
                  <p className="text-xs text-success">Order status updated to Completed</p>
                </div>
              )}
            </div>

            {/* Hint / Instructions */}
            <div className="text-center">
              {successOrder ? (
                <Button 
                  onClick={() => {
                    setSuccessOrder(null)
                    setVerifying(false)
                    // Re-run scanner
                    stopScanner().then(() => {
                      // Trigger useEffect reload or start it manually
                      onClose()
                    })
                  }} 
                  className="w-full rounded-xl"
                >
                  Close & Done
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Position the customer's order QR code within the frame to verify pickup status.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
