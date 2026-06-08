import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";


const HomePage = () => {
  const navigate = useNavigate();
  useEffect(() => {
  AOS.init({
    duration: 1200,
    once: true,
  });
}, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 bg-white shadow-sm">
        <div className="text-3xl font-bold text-orange-500">
          Pawn Billing
        </div>

        <div className="hidden md:flex gap-8 text-gray-700 font-medium">
          <a href="#overview">Overview</a>
          <a href="#features">Features</a>
          <a href="#roles">Access</a>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-slate-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-700 transition"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-28 text-center">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tight">
            Pawn Billing
            <br />
            Management System
          </h1>

          <p className="max-w-4xl mx-auto text-lg md:text-xl leading-9 text-gray-100">
            A centralized platform developed to manage customer loans,
            pledged items, repayments, transactions, expenses and
            administrative operations. Streamline financial processes,
            maintain accurate records and improve operational efficiency
            through a secure and user-friendly interface.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-5 mt-12">
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition"
            >
              Go To Sign In
            </button>

            <a
              href="#overview"
              className="border border-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-slate-900 transition"
            >
              About Software
            </a>
          </div>

          <p className="mt-10 text-xl font-semibold">
            Trusted Loan & Billing Management Solution
          </p>
        </div>
      </section>

      {/* Overview */}
      <section
        id="overview"
        className="max-w-6xl mx-auto px-6 py-24 text-center"
      >
        <h2 className="text-4xl font-bold mb-8">
          About Pawn Billing Software
        </h2>

        <p className="text-gray-600 text-lg leading-9">
          This Billing Management System is a centralized platform
          developed to manage customer loans, pledged items,
          repayments, transactions, expenses and administrative
          operations. The software helps businesses maintain accurate
          records, improve productivity and streamline day-to-day
          financial activities through a secure environment.
        </p>
      </section>

      {/* Features */}
      <section
       id="features"
       className="bg-slate-50 py-24 px-6 overflow-hidden"
      >
       <div className="max-w-7xl mx-auto">
         <h2 className="text-center text-5xl font-bold mb-16">
           Key Features
         </h2>

         <div className="grid md:grid-cols-3 gap-8">
           {[
             {
               title: "Loan Processing",
               desc: "Create and manage customer loans efficiently."
             },
             {
               title: "Customer Management",
               desc: "Maintain customer and pledged item records."
             },
             {
               title: "Repayment Tracking",
               desc: "Monitor repayments and outstanding balances."
             },
             {
               title: "Transaction Management",
               desc: "Track all billing transactions securely."
             },
             {
               title: "Expense Management",
               desc: "Manage operational expenses and cash flow."
             },
             {
               title: "Reports & Analytics",
               desc: "Generate business insights and reports."
             }
           ].map((item, index) => (
             <div
               key={item.title}
               data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
               className={`group
               bg-white
               rounded-3xl
               p-8
               shadow-lg
               hover:shadow-2xl
               hover:-translate-y-5
               transition-all
               duration-700
               hover:-translate-y-6
               ${
                 index % 2 === 0
                   ? "hover:rotate-2"
                   : "hover:-rotate-2"
               }`}
              >
               <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold mb-6">
                 {index + 1}
               </div>
     
               <h3 className="text-2xl font-bold mb-4">
                 {item.title}
               </h3>
     
               <p className="text-gray-600">
                 {item.desc}
               </p>
             </div>
           ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section
        id="roles"
        className="max-w-6xl mx-auto py-24 px-6"
      >
        <h2 className="text-center text-4xl font-bold mb-14">
          System Access
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-10 border">
            <h3 className="text-3xl font-bold text-indigo-700 mb-4">
              Admin
            </h3>

            <p className="text-gray-600">
              Full access to customers, loans,
              reports, billing and system settings.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-10 border">
            <h3 className="text-3xl font-bold text-indigo-700 mb-4">
              Manager
            </h3>

            <p className="text-gray-600">
              Manage customer records, loans,
              repayments and financial operations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">
          Pawn Billing Software
        </h2>

        <p className="text-gray-300 mb-8">
          Secure • Reliable • Efficient
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold"
        >
          Sign In Now
        </button>
      </footer>
    </div>
  );
};

export default HomePage;