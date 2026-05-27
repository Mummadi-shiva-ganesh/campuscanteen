import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/home/hero-section"
import { TodaysSpecials } from "@/components/home/todays-specials"
import { HowItWorks } from "@/components/home/how-it-works"
import { PopularCategories } from "@/components/home/popular-categories"
import { WalletPreview } from "@/components/home/wallet-preview"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TodaysSpecials />
      <PopularCategories />
      <HowItWorks />
      <WalletPreview />
      <Footer />
      {/* Spacer for mobile bottom nav */}
      <div className="h-20 md:hidden" />
    </main>
  )
}
