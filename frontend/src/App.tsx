import React, { useState, useEffect } from 'react'
import { MapPin, Zap, Info, CheckCircle, X, ShieldCheck, Globe, ArrowRight, Wallet, Moon, Sun } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for cleaner tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Plot {
  id: number
  location: string
  price_sats: number
  status: string
  description: string
  image_url: string
}

interface Invoice {
  payment_request: string
  r_hash: string
  plot_id: number
}

interface EscrowStatus {
  plot_id: number
  surveyor_approved: boolean
  lawyer_approved: boolean
  status: string
}

// Custom Logo Component: P + Lightning Bolt
const Logo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    className={cn("w-8 h-10", className)} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* The 'P' shape */}
    <path 
      d="M30 20H60C75 20 85 30 85 45C85 60 75 70 60 70H30V20Z" 
      stroke="currentColor" 
      strokeWidth="12" 
      strokeLinecap="round"
    />
    {/* The Lightning Bolt tail */}
    <path 
      d="M30 70V85L50 85L35 115" 
      stroke="currentColor" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

function App() {
  const [view, setView] = useState<'marketplace' | 'dashboard'>('marketplace')
  const [role, setRole] = useState<'buyer' | 'surveyor' | 'lawyer'>('buyer')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'generating' | 'pending' | 'settled'>('idle')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchPlots = () => {
    setLoading(true)
    fetch('/api/plots')
      .then(res => res.json())
      .then(data => {
        setPlots(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch plots", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPlots()
  }, [])

  // Poll for payment
  useEffect(() => {
    let interval: number
    if (invoice && paymentStatus === 'pending') {
      interval = setInterval(() => {
        fetch(`/api/payments/${invoice.r_hash}`)
          .then(res => res.json())
          .then(data => {
            if (data.settled) {
              setPaymentStatus('settled')
              clearInterval(interval)
              fetchPlots() // Refresh to show pending_escrow status
            }
          })
          .catch(err => console.error("Polling error", err))
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [invoice, paymentStatus])

  const handleBuy = async (plot: Plot) => {
    setSelectedPlot(plot)
    setPaymentStatus('generating')
    try {
      const res = await fetch(`/api/plots/${plot.id}/buy`, { method: 'POST' })
      if (!res.ok) throw new Error("Failed to generate invoice")
      const data = await res.json()
      setInvoice(data)
      setPaymentStatus('pending')
      
      // Auto-trigger WebLN if available
      if ((window as any).webln) {
        try {
          await (window as any).webln.enable()
          await (window as any).webln.sendPayment(data.payment_request)
        } catch (weblnError) {
          console.warn("WebLN auto-pay failed", weblnError)
        }
      }
    } catch (e) {
      console.error("Buy error", e)
      setPaymentStatus('idle')
    }
  }

  const handleApprove = async (plotId: number) => {
    try {
      const res = await fetch(`/api/escrows/${plotId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeholder: role, approved: true })
      })
      if (!res.ok) throw new Error("Approval failed")
      alert(`Approval successful! Funds for Plot #${plotId} are being processed.`)
      fetchPlots() // Refresh state
    } catch (e) {
      console.error("Approval error", e)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeModal = () => {
    setSelectedPlot(null)
    setInvoice(null)
    setPaymentStatus('idle')
  }

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-gray-50", isDarkMode && "bg-gray-950 text-white")}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className={cn("font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>Loading Marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-orange-100 selection:text-orange-900 transition-colors duration-300",
      isDarkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
    )}>
      {/* Navigation */}
      <nav className={cn(
        "sticky top-0 z-40 backdrop-blur-md border-b transition-colors",
        isDarkMode ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-gray-100"
      )}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-200 dark:shadow-none group-hover:scale-110 transition-transform">
              <Logo className="text-white w-6 h-7" />
            </div>
            <span className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => setView('marketplace')}>ProperSats</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => setView('marketplace')}
              className={cn("transition-colors", 
                view === 'marketplace' ? "text-orange-600" : (isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
              )}
            >
              Marketplace
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={cn("transition-colors", 
                view === 'dashboard' ? "text-orange-600" : (isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
              )}
            >
              Dashboard
            </button>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isDarkMode ? "bg-gray-800 text-orange-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
             >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             
             <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className={cn(
                "text-xs font-bold uppercase tracking-wider border-none rounded-full px-3 py-1.5 focus:ring-0 cursor-pointer",
                isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-600"
              )}
             >
                <option value="buyer">Buyer</option>
                <option value="surveyor">Surveyor</option>
                <option value="lawyer">Lawyer</option>
             </select>
             
             <button className={cn(
               "px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95",
               isDarkMode ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-black"
             )}>
              Connect
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'marketplace' ? (
          <>
            {/* Hero Section */}
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">
                Secure your land with <span className="text-orange-600">Bitcoin</span> instantly.
              </h2>
              <p className={cn("text-lg max-w-xl", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                Verified land listings with decentralized escrow. No fraud, no delays, total transparency.
              </p>
            </div>

            {/* Stats / Proof Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
               {[
                 { icon: ShieldCheck, title: "Secured Escrow", desc: "Multi-sig protection" },
                 { icon: Globe, title: "Verified Assets", desc: "Surveyor certified" },
                 { icon: Zap, title: "Instant Settlement", desc: "Via Lightning Network" }
               ].map((item, i) => (
                 <div key={i} className={cn(
                   "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                   isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"
                 )}>
                   <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-xl text-orange-600">
                     <item.icon size={20} />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm">{item.title}</h3>
                     <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>{item.desc}</p>
                   </div>
                 </div>
               ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plots.map(plot => (
                <div key={plot.id} className={cn(
                  "group rounded-3xl overflow-hidden border transition-all duration-300",
                  isDarkMode ? "bg-gray-900 border-gray-800 hover:border-orange-900/50" : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1"
                )}>
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={plot.image_url} 
                      alt={plot.location} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute top-4 left-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        plot.status === 'available' ? "bg-white text-green-600" : 
                        plot.status === 'pending_escrow' ? "bg-orange-600 text-white" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {plot.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                       <div className={cn(
                         "backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm",
                         isDarkMode ? "bg-gray-900/90 text-white" : "bg-white/90 text-gray-900"
                       )}>
                          <p className="text-[10px] opacity-60 font-bold uppercase tracking-wide leading-none mb-1">Price</p>
                          <p className="text-lg font-black leading-none">
                            {plot.price_sats.toLocaleString()} <span className="text-[10px] font-bold opacity-40">SATS</span>
                          </p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={16} className="text-orange-600" />
                      <h3 className="text-xl font-bold tracking-tight">{plot.location}</h3>
                    </div>
                    <p className={cn("text-sm mb-6 leading-relaxed line-clamp-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      {plot.description}
                    </p>
                    <button 
                      onClick={() => handleBuy(plot)}
                      disabled={plot.status !== 'available'}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50",
                        isDarkMode ? "bg-gray-100 text-gray-900 hover:bg-white" : "bg-gray-900 text-white hover:bg-orange-600"
                      )}
                    >
                      <Zap size={18} fill="currentColor" /> Buy with Lightning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">Stakeholder Dashboard</h2>
              <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-500")}>
                Managing escrow for <span className="text-orange-600 font-bold uppercase">{role}</span>
              </p>
            </div>

            <div className="space-y-4">
              {plots.filter(p => p.status === 'pending_escrow').length === 0 ? (
                <div className={cn(
                  "rounded-3xl p-12 text-center border border-dashed",
                  isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                )}>
                  <p className="text-gray-400 font-medium">No pending escrows found.</p>
                </div>
              ) : (
                plots.filter(p => p.status === 'pending_escrow').map(plot => (
                  <div key={plot.id} className={cn(
                    "p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                    isDarkMode ? "bg-gray-900 border-gray-800 hover:border-orange-900/50" : "bg-white border-gray-100 shadow-sm hover:border-orange-200"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl text-orange-600 animate-pulse">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{plot.location}</h3>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-500" : "text-gray-500")}>
                          {plot.price_sats.toLocaleString()} SATS • ID: #{plot.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2 bg-green-50 dark:bg-green-950/30 text-green-600 border-green-100 dark:border-green-900">
                          <CheckCircle size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-tighter">Buyer Paid</span>
                      </div>
                      <div className="w-8 h-px bg-gray-100 dark:bg-gray-800 mt-[-16px]"></div>
                      <div className="flex flex-col items-center">
                         <div className={cn(
                           "w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 transition-all",
                           isDarkMode ? "bg-gray-800 border-gray-700 text-gray-600" : "bg-gray-50 border-gray-100 text-gray-300"
                         )}>
                            <ShieldCheck size={16} />
                         </div>
                         <span className="text-[10px] font-bold uppercase text-gray-500 tracking-tighter">Verified</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       {role !== 'buyer' && (
                         <button 
                          onClick={() => handleApprove(plot.id)}
                          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 dark:shadow-none"
                         >
                           Approve Release
                         </button>
                       )}
                       <button className={cn(
                         "px-4 py-3 rounded-xl font-bold text-sm transition-colors",
                         isDarkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                       )}>
                         View Docs
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-12">
               <h3 className="text-xl font-bold mb-4">Completed Sales</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plots.filter(p => p.status === 'sold').map(plot => (
                    <div key={plot.id} className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between",
                      isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
                    )}>
                       <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="font-bold">{plot.location}</span>
                       </div>
                       <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Settled</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className={cn(
            "w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300",
            isDarkMode ? "bg-gray-900 text-white" : "bg-white"
          )}>
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
            
            {paymentStatus === 'settled' ? (
              <div className="p-8 text-center py-12">
                <div className="w-24 h-24 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6 scale-in duration-500">
                   <CheckCircle size={48} className="text-green-600" />
                </div>
                <h2 className="text-3xl font-black mb-4">Payment Confirmed</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  The plot at <span className="font-bold text-gray-900 dark:text-white">{selectedPlot.location}</span> is now under contract. Funds are secured in escrow.
                </p>
                <button onClick={closeModal} className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                  isDarkMode ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-black"
                )}>
                  View in Dashboard <ArrowRight size={18} />
                </button>
              </div>
            ) : paymentStatus === 'generating' ? (
              <div className="p-8 py-20 text-center">
                 <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-orange-100 dark:border-orange-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                 </div>
                 <h2 className="text-xl font-bold mb-2">Generating Invoice...</h2>
                 <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Please wait</p>
              </div>
            ) : (
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-1">Confirm Purchase</h2>
                  <p className="text-gray-500 text-sm">Secure land acquisition via Lightning</p>
                </div>

                <div className={cn(
                  "rounded-3xl p-6 flex flex-col items-center mb-8 border",
                  isDarkMode ? "bg-orange-950/10 border-orange-900/30" : "bg-orange-50 border-orange-100"
                )}>
                  {invoice && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <QRCodeSVG value={invoice.payment_request} size={200} />
                    </div>
                  )}
                  <p className="text-sm font-bold text-orange-600 flex items-center gap-2 animate-pulse">
                     <Zap size={14} fill="currentColor" /> Waiting for payment...
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Price</span>
                    <span className="font-black text-lg">{selectedPlot.price_sats.toLocaleString()} SATS</span>
                  </div>
                  <div className={cn("flex justify-between items-center text-sm border-t pt-4", isDarkMode ? "border-gray-800" : "border-gray-50")}>
                    <span className="text-gray-500 font-medium">Location</span>
                    <span className="font-bold">{selectedPlot.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => invoice && copyToClipboard(invoice.payment_request)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors",
                      isDarkMode ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                   >
                     {copied ? <CheckCircle size={16} className="text-green-600" /> : <Wallet size={16} />} 
                     {copied ? 'Copied' : 'Copy Invoice'}
                   </button>
                   <button 
                    onClick={async () => {
                      if (!invoice) return;
                      try {
                        await (window as any).webln.enable();
                        await (window as any).webln.sendPayment(invoice.payment_request);
                      } catch (e) {
                        console.error("Manual pay error", e);
                      }
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      (window as any).webln ? "bg-orange-600 text-white hover:bg-orange-700" : (isDarkMode ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400 cursor-not-allowed")
                    )}
                   >
                     <Zap size={16} fill="currentColor" /> Wallet Pay
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={cn(
        "max-w-7xl mx-auto px-4 py-12 border-t mt-12 flex flex-col md:flex-row justify-between items-center gap-6",
        isDarkMode ? "border-gray-800 text-gray-500" : "border-gray-100 text-gray-400"
      )}>
         <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
            <Logo className="w-5 h-6" />
            <span className="font-bold tracking-tight">ProperSats</span>
         </div>
         <p className="text-xs">© 2026 ProperSats. Built for the Future of Bitcoin.</p>
         <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-orange-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Github</a>
         </div>
      </footer>
    </div>
  )
}

export default App
