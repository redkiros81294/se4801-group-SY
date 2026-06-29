import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--t1)] overflow-hidden relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E3A5F]/40 via-[#0A0F1E] to-[#0A0F1E]"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="animate-grid-bg"></div>
        </div>
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
            left: mousePos.x - 300,
            top: mousePos.y - 300,
          }}
        ></div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)]/40 bg-[var(--bg0)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--cyan)] to-[var(--blue)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--cyan)]/20">
              <i className="ti ti-shield-check text-white text-lg"></i>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--blue)] bg-clip-text text-transparent">
              ChainTrack
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-[var(--t2)] hover:text-[var(--t1)] transition-colors text-sm font-medium"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => window.open('https://github.com/redkiros81294/se4801-group-SY', '_blank')}
              className="px-5 py-2 bg-gradient-to-r from-[var(--blue)] to-[var(--blue)]/80 text-white rounded-lg hover:shadow-lg hover:shadow-[var(--blue)]/30 transition-all text-sm font-medium"
            >
              GitHub
            </button>
          </nav>
        </div>
      </header>

      <main className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-200px)]">
            <div className="space-y-8 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--cyan)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--cyan)]"></span>
                </span>
                <span className="text-[var(--cyan)] text-sm font-medium">Supply Chain Provenance Platform</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                <span className="text-[var(--t1)]">Track every product</span>
                <br />
                <span className="bg-gradient-to-r from-[var(--cyan)] via-[var(--blue)] to-[var(--cyan)] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  from source to shelf
                </span>
              </h1>

              <p className="text-lg text-[var(--t2)] leading-relaxed">
                ChainTrack provides end-to-end supply chain visibility with QR-based verification,
                immutable transaction history, and role-based access control for manufacturers,
                shippers, and retailers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="group h-14 px-8 bg-gradient-to-r from-[var(--blue)] to-[var(--blue)]/90 text-white rounded-xl hover:shadow-xl hover:shadow-[var(--blue)]/30 transition-all font-medium flex items-center justify-center gap-2"
                >
                  View Demo
                  <i className="ti ti-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                {[
                  { icon: 'ti ti-users', value: '500+' },
                  { icon: 'ti ti-box', value: '50K+' },
                  { icon: 'ti ti-check', value: '99.9%' }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <i className={`ti ${stat.icon} text-[var(--cyan)]`}></i>
                    <span className="text-sm text-[var(--t2)]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-[var(--bg1)]/60 border border-[var(--border)]/40 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--t1)]">Live Dashboard</h3>
                    <p className="text-sm text-[var(--t2)]">Real-time supply chain data</p>
                  </div>
                  <span className="px-3 py-1 bg-[var(--green)]/10 text-[var(--green)] text-xs rounded-full font-medium flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--green)]"></span>
                    </span>
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Products Tracked', value: '12,480', icon: 'ti ti-box', trend: '+12%', color: 'var(--cyan)' },
                    { label: 'Batches Verified', value: '3,842', icon: 'ti ti-check', trend: '+8%', color: 'var(--green)' },
                    { label: 'Active Shipments', value: '156', icon: 'ti ti-truck', trend: '-3%', color: 'var(--amber)' },
                    { label: 'Security Score', value: '98.5', icon: 'ti ti-shield', trend: '+2%', color: 'var(--blue)' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-[var(--bg2)]/40 border border-[var(--border)]/30 rounded-xl p-4 space-y-2 hover:border-[var(--cyan)]/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                          <i className={`ti ${stat.icon}`} style={{ color: stat.color }}></i>
                        </div>
                        <span className="text-xs text-[var(--green)] font-medium">{stat.trend}</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--t1)]">{stat.value}</p>
                        <p className="text-xs text-[var(--t2)]">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-[var(--bg2)]/40 border border-[var(--border)]/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ti ti-clock text-[var(--cyan)] text-sm"></i>
                    <span className="text-xs font-medium text-[var(--t2)]">Recent Activity</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { text: 'Batch #CT-2026-156 verified at RetailPlus', time: '2m ago', icon: 'ti ti-check' },
                      { text: 'Shipment departed PharmaCorp → FastTrack', time: '15m ago', icon: 'ti ti-truck' },
                      { text: 'New product registered: Cardiology Device', time: '1h ago', icon: 'ti ti-plus' },
                      { text: 'QR token generated for batch #CT-2026-157', time: '2h ago', icon: 'ti ti-qrcode' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-[var(--cyan)]/10 flex items-center justify-center flex-shrink-0">
                          <i className={`ti ${item.icon} text-[var(--cyan)] text-xs`}></i>
                        </div>
                        <span className="text-[var(--t2)] flex-1 truncate">{item.text}</span>
                        <span className="text-xs text-[var(--t3)]">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--cyan)]/10 rounded-full blur-xl animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[var(--blue)]/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)]/40 bg-[var(--bg1)]/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--cyan)] to-[var(--blue)] rounded-lg flex items-center justify-center">
                  <i className="ti ti-shield-check text-white text-sm"></i>
                </div>
                <span className="text-lg font-bold text-[var(--t1)]">ChainTrack</span>
              </div>
              <p className="text-sm text-[var(--t2)] leading-relaxed">
                Smart supply chain provenance platform ensuring authenticity from source to shelf.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--t1)] mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'API'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[var(--t2)] hover:text-[var(--cyan)] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--t1)] mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[var(--t2)] hover:text-[var(--cyan)] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--t1)] mb-4">Legal</h4>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Security', 'Cookies'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[var(--t2)] hover:text-[var(--cyan)] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border)]/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--t3)]">
              © 2026 ChainTrack. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {['ti ti-brand-github', 'ti ti-brand-twitter', 'ti ti-brand-linkedin'].map((icon) => (
                <a key={icon} href="#" className="w-8 h-8 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/40 flex items-center justify-center text-[var(--t2)] hover:text-[var(--cyan)] hover:border-[var(--cyan)]/30 transition-colors">
                  <i className={`${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
