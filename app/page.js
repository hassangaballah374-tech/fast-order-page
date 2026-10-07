'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ShopifyStyleLandingPage() {
  const [currencyModal, setCurrencyModal] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#008060] selection:text-white" dir="ltr">
      
      {/* 🧭 1. الترويسة العلوية (Shopify Navigation Bar) */}
      <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/10 px-6 lg:px-12 py-4 flex items-center justify-between">
        
        {/* اللوجو والروابط الرئيسية */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            {/* أيقونة شوبيفاي الشهيرة */}
            <div className="w-9 h-9 bg-[#008060] rounded-lg flex items-center justify-center p-1.5 shadow-md">
              <svg viewBox="0 0 109 123" fill="none" className="w-full h-full text-white">
                <path d="M74.6 15.6c-.3-1.6-1.5-2.7-3.1-2.9-1.6-.2-10.8-.2-10.8-.2s-7.1-7.1-8.1-8.1C51.6 3.4 49.8 0 44.7 0c-4.1 0-7.8 1.6-10.6 4.3C30.6 7.8 29.2 12 29.2 16.5c0 1.2.1 2.3.4 3.4L6.9 26.6c-2.3.7-3.8 2.8-3.7 5.2l9.1 76.5c.3 2.6 2.5 4.6 5.1 4.6h73.7c2.6 0 4.8-2 5.1-4.6L105.4 32c.1-2.4-1.4-4.5-3.7-5.2L74.6 15.6z" fill="#95BF47"/>
                <path d="M60.7 12.5s-7.1-7.1-8.1-8.1C51.6 3.4 49.8 0 44.7 0c-4.1 0-7.8 1.6-10.6 4.3C30.6 7.8 29.2 12 29.2 16.5c0 1.2.1 2.3.4 3.4l31.1-7.4z" fill="#5E8E3E"/>
                <path d="M57.6 36.8l-7.3 2.2c-.7.2-1.3-.2-1.5-.9l-5.6-18.7c-.2-.7.2-1.3.9-1.5l7.3-2.2c.7-.2 1.3.2 1.5.9l5.6 18.7c.2.7-.2 1.3-.9 1.5z" fill="#FFFFFF"/>
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center">
              shopify
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-200">
            <button className="flex items-center gap-1 hover:text-white transition cursor-pointer">
              <span>Why Shopify</span>
              <span className="text-[10px]">▼</span>
            </button>
            <button className="flex items-center gap-1 hover:text-white transition cursor-pointer">
              <span>Products</span>
              <span className="text-[10px]">▼</span>
            </button>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/enterprise" className="hover:text-white transition">Enterprise</Link>
          </div>
        </div>

        {/* أزرار التسجيل والدخول */}
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-bold text-slate-200 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-black font-bold text-sm rounded-full transition shadow-md"
          >
            Start for free
          </Link>
        </div>
      </nav>

      {/* 🌌 2. القسم الرئيسي (Hero Section with Authentic Shopify Gradients) */}
      <section className="relative overflow-hidden bg-black py-28 lg:py-36 px-6 lg:px-16 border-b border-white/5">
        {/* طبقة التدرج اللوني الشبيه بشاشتك تماماً */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background: `
              radial-gradient(circle at 10% 90%, rgba(100, 50, 160, 0.45) 0%, transparent 50%),
              radial-gradient(circle at 85% 20%, rgba(0, 128, 96, 0.35) 0%, transparent 60%)
            `,
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Log in to Shopify
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-normal max-w-xl leading-relaxed">
            Sign in to your store account, or open a new Shopify store for free.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-white hover:bg-slate-100 text-black font-bold text-sm rounded-full transition shadow-lg"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 border border-white hover:bg-white/10 text-white font-bold text-sm rounded-full transition"
            >
              Start for free
            </Link>
          </div>

          <p className="text-xs text-slate-400 font-medium pt-2">
            Start free then enjoy 3 months for 1 US$/month
          </p>
        </div>
      </section>

      {/* 📦 3. قسم الكروت والمميزات (Take your store to the next level) */}
      <section className="bg-white text-black py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl font-normal tracking-tight text-black leading-tight max-w-md">
              Take your store <br />
              to the next level
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* كارت 1: All in one platform */}
            <div className="border border-slate-200 rounded-3xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-black rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                {/* تمثيل جرافيك الشحن والدفع كالصورة */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute left-2 top-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] text-white flex gap-1 items-center">
                    <span>💳 Visa</span>
                    <span>Pay</span>
                  </div>
                  <div className="w-24 h-32 bg-[#e8ded3] rounded-xl shadow-lg border border-white/10 flex items-center justify-center text-3xl">
                    🧥
                  </div>
                  <div className="absolute right-2 bottom-2 bg-[#d2a679] w-14 h-12 rounded-lg border border-amber-900/30 flex items-center justify-center text-xs text-white font-mono shadow-md">
                    📦
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black">All in one platform</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Run everything in one place—from shipping to inventory and order management.
                </p>
              </div>
            </div>

            {/* كارت 2: World's best checkout */}
            <div className="border border-slate-200 rounded-3xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-black rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="bg-white rounded-2xl p-4 w-4/5 shadow-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">👕</div>
                    <div>
                      <strong className="block text-[11px] font-bold text-black">Jahmad Long Sleeve Polo</strong>
                      <span className="text-[10px] text-slate-400">Fern, Size XS</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[11px]">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold font-mono">$57.99</span>
                  </div>
                  <div className="bg-[#5a31f4] text-white text-center py-2 rounded-xl font-bold text-xs tracking-wider">
                    shop Pay
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black">World’s best checkout</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fast, flexible, and converts 15% better than other platforms on average.
                </p>
              </div>
            </div>

            {/* كارت 3: 8,000+ apps */}
            <div className="border border-slate-200 rounded-3xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-black rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                {/* شبكة الأيقونات كالصورة */}
                <div className="grid grid-cols-4 gap-2.5 items-center justify-center">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs">🎵</div>
                  <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white text-xs">S</div>
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-xs">🛍️</div>
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-xs">🦊</div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-xs">🚀</div>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs">BR</div>
                  <div className="w-9 h-9 rounded-xl bg-white text-black font-bold flex items-center justify-center text-xs">O+</div>
                  <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center font-bold text-white text-xs">qb</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black">8,000+ apps</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Boost sales and functionality with apps from the Shopify App Store.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 🖤 4. الفوتر المطابق للصورة (Shopify Official Dark Footer) */}
      <footer className="bg-black text-white pt-20 pb-12 px-6 lg:px-16 border-t border-white/10 text-xs">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            
            {/* الشعار كأيقونة الحقيبة */}
            <div className="col-span-2 md:col-span-1">
              <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center p-2">
                <svg viewBox="0 0 109 123" fill="none" className="w-full h-full text-white">
                  <path d="M74.6 15.6c-.3-1.6-1.5-2.7-3.1-2.9-1.6-.2-10.8-.2-10.8-.2s-7.1-7.1-8.1-8.1C51.6 3.4 49.8 0 44.7 0c-4.1 0-7.8 1.6-10.6 4.3C30.6 7.8 29.2 12 29.2 16.5c0 1.2.1 2.3.4 3.4L6.9 26.6c-2.3.7-3.8 2.8-3.7 5.2l9.1 76.5c.3 2.6 2.5 4.6 5.1 4.6h73.7c2.6 0 4.8-2 5.1-4.6L105.4 32c.1-2.4-1.4-4.5-3.7-5.2L74.6 15.6z" fill="#FFFFFF"/>
                </svg>
              </div>
            </div>

            {/* عمود Shopify */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-white text-sm">Shopify</h4>
              <ul className="space-y-2.5 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Shopify Editions</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition">Investors</Link></li>
                <li><Link href="#" className="hover:text-white transition">Newsroom</Link></li>
              </ul>
            </div>

            {/* عمود Ecosystem */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-white text-sm">Ecosystem</h4>
              <ul className="space-y-2.5 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Developer Docs</Link></li>
                <li><Link href="#" className="hover:text-white transition">Theme Store</Link></li>
                <li><Link href="#" className="hover:text-white transition">App Store</Link></li>
                <li><Link href="#" className="hover:text-white transition">Partners</Link></li>
                <li><Link href="#" className="hover:text-white transition">Affiliates</Link></li>
              </ul>
            </div>

            {/* عمود Resources */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-white text-sm">Resources</h4>
              <ul className="space-y-2.5 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Compare Shopify</Link></li>
                <li><Link href="#" className="hover:text-white transition">Free Tools</Link></li>
                <li><Link href="#" className="hover:text-white transition">Changelog</Link></li>
              </ul>
            </div>

            {/* عمود Support */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-white text-sm">Support</h4>
              <ul className="space-y-2.5 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Shopify Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Community Forum</Link></li>
                <li><Link href="#" className="hover:text-white transition">Hire a Partner</Link></li>
                <li><Link href="#" className="hover:text-white transition">Service Status</Link></li>
              </ul>
            </div>

          </div>

          {/* الخط الفاصل وشريط اللغة والروابط القانونية */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-[11px]">
              <button 
                onClick={() => setCurrencyModal(!currencyModal)}
                className="flex items-center gap-1.5 hover:text-white transition text-white font-semibold cursor-pointer"
              >
                <span>🌐 Egypt | English</span>
                <span className="text-[9px]">▼</span>
              </button>

              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/legal" className="hover:text-white transition">Legal</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/sitemap" className="hover:text-white transition">Sitemap</Link>
              <div className="flex items-center gap-1 text-slate-400">
                <span>Your Privacy Choices</span>
                <span className="bg-blue-600 text-[9px] px-1 rounded-sm text-white font-bold">✓x</span>
              </div>
            </div>

            {/* أيقونات السوشيال ميديا الدائرية */}
            <div className="flex items-center gap-3">
              {['Facebook', 'X', 'YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'Pinterest'].map((net, i) => (
                <div 
                  key={i} 
                  className="w-7 h-7 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] hover:bg-slate-200 transition cursor-pointer"
                  title={net}
                >
                  {net.charAt(0)}
                </div>
              ))}
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
}
