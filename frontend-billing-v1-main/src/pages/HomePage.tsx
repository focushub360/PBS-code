import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "🏦",
    title: "Loan Processing",
    desc: "Create and manage gold loans instantly with automated calculations and approval workflows.",
  },
  {
    icon: "👥",
    title: "Customer Management",
    desc: "Maintain complete customer profiles, pledged item records, and KYC documents in one place.",
  },
  {
    icon: "💰",
    title: "Repayment Tracking",
    desc: "Monitor due dates, outstanding balances, and send automated reminders effortlessly.",
  },
  {
    icon: "🧾",
    title: "Transaction Management",
    desc: "Track every billing transaction with detailed audit trails and real-time ledger updates.",
  },
  {
    icon: "📊",
    title: "Expense Management",
    desc: "Manage operational expenses, petty cash, and monitor overall cash flow at a glance.",
  },
  {
    icon: "📈",
    title: "Reports & Analytics",
    desc: "Generate daily, monthly, and custom business reports with visual insights and exports.",
  },
  {
    icon: "🔒",
    title: "Role-Based Access",
    desc: "Admin and Manager roles with granular permissions to protect sensitive financial data.",
  },
  {
    icon: "🪙",
    title: "Gold Rate Integration",
    desc: "Auto-calculate loan values based on live gold rates and purity for accurate assessments.",
  },
];

// Duplicate for infinite scroll
const duplicatedFeatures = [...features, ...features];

const stats = [
  { value: "5000+", label: "Transactions" },
  { value: "1500+", label: "Customers" },
  { value: "99.9%", label: "Accuracy" },
];

const trustedBy = [
  "Gold Palace Jewellers",
  "Sri Murugan Finance",
  "Lakshmi Pawn Brokers",
  "Royal Gold Finance",
  "Sri Venkateswara Loans",
  "Annamalai Pawn Shop",
];

const HomePage = () => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const isPausedRef = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Horizontal auto-scroll for features
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.6; // px per frame ~= moves every ~2-3s per card

    const animate = () => {
      if (!isPausedRef.current && track) {
        posRef.current += speed;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) {
          posRef.current = 0;
        }
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav
        className={`flex items-center justify-between px-10 py-4 sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/60 backdrop-blur-2xl border-b border-white/10 shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-black text-sm">
            P
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Pawn<span className="text-yellow-400">Billing</span>
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm text-gray-400 font-medium">
          <a href="#overview" className="hover:text-white transition-colors">Overview</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#roles" className="hover:text-white transition-colors">Access</a>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105"
        >
          Sign In
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-yellow-500/10 blur-[160px] rounded-full" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/15 blur-[140px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-600/10 blur-[120px] rounded-full" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 py-32 text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 text-yellow-400 text-xs font-semibold tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Premium Pawn Management Solution
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-white">Manage Gold Loans</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              Effortlessly.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed mb-10">
            A complete billing management system for pawn brokers — handle
            loans, repayments, customer records, and financial reports from one
            secure platform.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button
              onClick={() => navigate("/login")}
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-10 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-yellow-400/20"
            >
              Get Started →
            </button>
            <a
              href="#overview"
              className="border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-full text-base font-medium transition-all duration-200 hover:bg-white/5"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 md:gap-20">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black text-yellow-400">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted By Ticker ── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-4 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          {[...trustedBy, ...trustedBy, ...trustedBy].map((name, i) => (
            <span key={i} className="text-gray-600 text-sm font-medium shrink-0">
              ◆ {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      <section id="overview" className="max-w-5xl mx-auto px-6 py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">About the Platform</span>
            <h2 className="text-4xl font-black text-white mt-4 mb-6 leading-tight">
              Built for Modern<br />Pawn Businesses
            </h2>
            <p className="text-gray-400 text-base leading-8">
              Pawn Billing is a centralized platform designed to simplify gold
              loan management. From customer onboarding to final repayment,
              every operation is tracked, audited, and secured — giving you
              complete visibility over your business finances.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {["Secure Role-Based Login", "Real-Time Ledger Updates", "Automated Due Date Alerts"].map((pt) => (
                <div key={pt} className="flex items-center gap-3 text-gray-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold">✓</span>
                  {pt}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-gray-600 text-xs ml-2 font-mono">dashboard.pawnbilling.app</span>
              </div>
              <div className="space-y-3">
                <div className="bg-yellow-400/10 rounded-xl p-4 border border-yellow-400/20">
                  <div className="text-yellow-400 text-xs font-bold mb-1">TODAY'S LOANS</div>
                  <div className="text-2xl font-black text-white">₹4,82,000</div>
                  <div className="text-gray-500 text-xs mt-1">↑ 12% from yesterday</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-gray-500 text-xs mb-1">Active Loans</div>
                    <div className="text-xl font-bold text-white">248</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-gray-500 text-xs mb-1">Due Today</div>
                    <div className="text-xl font-bold text-red-400">17</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-500 text-xs mb-2">Monthly Collection</div>
                  <div className="flex gap-1 items-end h-10">
                    {[40, 65, 50, 80, 70, 90, 75, 95, 60, 85, 100, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-yellow-400/60 rounded-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400/10 blur-[60px] rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Features Horizontal Scroll ── */}
      <section id="features" className="py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">What We Offer</span>
          <h2 className="text-4xl font-black text-white mt-4">Key Features</h2>
          <p className="text-gray-500 mt-2 text-sm">Hover to pause — scroll through everything we offer</p>
        </div>

        {/* Horizontal scrolling track */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
        >
          {/* Fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050816] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050816] to-transparent z-10 pointer-events-none" />

          <div ref={trackRef} className="flex gap-6 w-max px-24">
            {duplicatedFeatures.map((feature, index) => (
              <div
                key={index}
                className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-3xl p-7 backdrop-blur-xl
                  hover:border-yellow-400/40 hover:bg-white/8 hover:shadow-xl hover:shadow-yellow-400/5
                  transition-all duration-300 cursor-default group"
              >
                <div className="text-4xl mb-5">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-6">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="max-w-5xl mx-auto py-24 px-6">
        <div className="text-center mb-14">
          <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">System Access</span>
          <h2 className="text-4xl font-black text-white mt-4">Two Roles, Full Control</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative bg-gradient-to-br from-yellow-400/10 to-amber-600/5 border border-yellow-400/20 rounded-3xl p-10 overflow-hidden group hover:border-yellow-400/50 transition-all duration-300">
            <div className="absolute top-4 right-4 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl" />
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center text-2xl mb-6">
              👑
            </div>
            <h3 className="text-2xl font-black text-yellow-400 mb-3">Admin</h3>
            <p className="text-gray-400 text-sm leading-7">
              Full system access — manage customers, loans, repayments, expenses,
              reports, user accounts, and all system settings from a single
              dashboard.
            </p>
            <ul className="mt-6 space-y-2">
              {["User management", "All financial reports", "System configuration", "Audit logs"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-yellow-400">→</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-10 overflow-hidden group hover:border-purple-400/40 transition-all duration-300">
            <div className="absolute top-4 right-4 w-20 h-20 bg-purple-400/10 rounded-full blur-2xl" />
            <div className="w-12 h-12 rounded-2xl bg-purple-400/20 flex items-center justify-center text-2xl mb-6">
              🧑‍💼
            </div>
            <h3 className="text-2xl font-black text-purple-400 mb-3">Manager</h3>
            <p className="text-gray-400 text-sm leading-7">
              Operational access to manage customer records, process loans,
              handle repayments, and track daily financial activities
              efficiently.
            </p>
            <ul className="mt-6 space-y-2">
              {["Customer records", "Loan processing", "Repayment entry", "Daily reports"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-purple-400">→</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative bg-gradient-to-br from-yellow-400/15 via-amber-500/10 to-purple-600/10 border border-yellow-400/20 rounded-3xl p-14 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-400/10 blur-[100px] rounded-full" />
          <h2 className="text-4xl font-black text-white mb-4 relative">Ready to streamline your pawn business?</h2>
          <p className="text-gray-400 mb-8 relative">Join hundreds of pawn brokers who trust Pawn Billing for daily operations.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-10 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-yellow-400/20 relative"
          >
            Sign In Now →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-black/40 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-black text-xs">P</div>
          <span className="font-bold text-white">Pawn<span className="text-yellow-400">Billing</span></span>
        </div>
        <p className="text-gray-600 text-sm">Secure · Reliable · Efficient</p>
        <p className="text-gray-700 text-xs mt-4">© 2026 Pawn Billing Management System. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;