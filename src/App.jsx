import { useState, useEffect, useMemo } from "react";
import { Shield, Phone, MessageSquare, FileText, Home, DollarSign, Calendar, TrendingDown, Star, Award } from "lucide-react";

export default function ServiceFirstMortgageCalculator() {
  // Loan inputs
  const [loanType, setLoanType] = useState("VA");
  const [homePrice, setHomePrice] = useState(385000);
  const [downPayment, setDownPayment] = useState(0);
  const [downPaymentPercent, setDownPaymentPercent] = useState(0);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(6.02);
  const [propertyTaxRate, setPropertyTaxRate] = useState(0.65);
  const [insurance, setInsurance] = useState(1400);
  const [hoaDues, setHoaDues] = useState(0);
  const [animatedPayment, setAnimatedPayment] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showRateAdmin, setShowRateAdmin] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));

  // Editable rate table — update these any morning without touching code
  const [rates, setRates] = useState({
    VA: { 30: 6.02, 15: 5.72 },
    FHA: { 30: 6.10, 15: 5.80 },
    Conventional: { 30: 6.35, 15: 6.03 },
  });

  const updateRate = (type, term, value) => {
    setRates(prev => ({
      ...prev,
      [type]: { ...prev[type], [term]: Number(value) }
    }));
    setLastUpdated(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
  };

  // Update rate when loan type or term changes
  useEffect(() => {
    setInterestRate(rates[loanType][loanTerm]);
  }, [loanType, loanTerm, rates]);

  // Sync down payment percent with dollar amount
  useEffect(() => {
    if (homePrice > 0) {
      setDownPaymentPercent(((downPayment / homePrice) * 100).toFixed(1));
    }
  }, [downPayment, homePrice]);

  // Calculations
  const calculations = useMemo(() => {
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    // VA Funding Fee (2.15% first use, no down payment)
    const vaFundingFee = loanType === "VA" ? loanAmount * 0.0215 : 0;
    // FHA UFMIP (1.75%)
    const fhaUFMIP = loanType === "FHA" ? loanAmount * 0.0175 : 0;
    // Total financed
    const totalFinanced = loanAmount + vaFundingFee + fhaUFMIP;

    // Monthly P&I
    const monthlyPI = monthlyRate > 0
      ? (totalFinanced * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;

    // Monthly tax & insurance
    const monthlyTax = (homePrice * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = insurance / 12;

    // PMI (Conventional only, if down payment < 20%)
    const monthlyPMI = (loanType === "Conventional" && downPayment / homePrice < 0.2)
      ? (loanAmount * 0.005) / 12 : 0;

    // FHA monthly MIP (0.55% annually)
    const monthlyMIP = loanType === "FHA" ? (loanAmount * 0.0055) / 12 : 0;

    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyMIP + Number(hoaDues);
    const totalInterest = (monthlyPI * numPayments) - totalFinanced;

    return {
      loanAmount,
      totalFinanced,
      vaFundingFee,
      fhaUFMIP,
      monthlyPI,
      monthlyTax,
      monthlyInsurance,
      monthlyPMI,
      monthlyMIP,
      totalMonthly,
      totalInterest,
    };
  }, [homePrice, downPayment, loanTerm, interestRate, propertyTaxRate, insurance, hoaDues, loanType]);

  // Animate the payment number
  useEffect(() => {
    const target = calculations.totalMonthly;
    const duration = 600;
    const steps = 30;
    const stepValue = (target - animatedPayment) / steps;
    let current = animatedPayment;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      current += stepValue;
      setAnimatedPayment(current);
      if (count >= steps) {
        setAnimatedPayment(target);
        clearInterval(interval);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [calculations.totalMonthly]);

  const formatCurrency = (n) =>
    "$" + Math.round(n).toLocaleString("en-US");

  // Pie chart data
  const pieData = [
    { label: "Principal & Interest", value: calculations.monthlyPI, color: "#1e3a8a" },
    { label: "Property Tax", value: calculations.monthlyTax, color: "#b91c1c" },
    { label: "Homeowners Insurance", value: calculations.monthlyInsurance, color: "#ca8a04" },
    { label: loanType === "Conventional" ? "PMI" : loanType === "FHA" ? "MIP" : "VA Fee (financed)", value: calculations.monthlyPMI + calculations.monthlyMIP, color: "#475569" },
    { label: "HOA", value: Number(hoaDues), color: "#64748b" },
  ].filter(d => d.value > 0);

  // Calculate pie slices
  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  let cumulativeAngle = -90;
  const slices = pieData.map(d => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;
    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;
    return {
      ...d,
      percentage,
      path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20 animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
              animationDuration: Math.random() * 3 + 2 + "s",
            }}
          />
        ))}
      </div>

      {/* Top stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-blue-700" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 mb-4">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-red-300">Those Who Served, Now Serving You</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] pb-2 mb-3 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Mortgage Calculator
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-2xl mx-auto">
            Built for Veterans, First Responders & Tennessee Families.
            <br />
            <span className="text-yellow-400 font-semibold">See your real numbers in seconds.</span>
          </p>
        </div>

        {/* Rate Admin (for John to update daily) */}
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => setShowRateAdmin(!showRateAdmin)}
            className="w-full flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/90 border border-yellow-700/40 rounded-xl px-4 py-3 transition-all group"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-300">Today's Rates</span>
              <span className="text-xs text-slate-400">· Updated {lastUpdated}</span>
            </div>
            <span className="text-xs text-yellow-500 group-hover:text-yellow-300">
              {showRateAdmin ? "▲ Close" : "▼ Update Rates"}
            </span>
          </button>

          {showRateAdmin && (
            <div className="mt-2 bg-slate-900/80 backdrop-blur-sm border border-yellow-700/30 rounded-xl p-5 animate-fadeIn">
              <p className="text-xs text-slate-400 mb-4 italic">
                Rates update live across the calculator as you type. Bookmark this page or save it to your phone for daily updates.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {["VA", "FHA", "Conventional"].map((type) => (
                  <div key={type} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs font-bold text-blue-300 uppercase mb-2">{type}</p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">30-yr Fixed (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rates[type][30]}
                          onChange={(e) => updateRate(type, 30, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-yellow-300 font-bold focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">15-yr Fixed (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rates[type][15]}
                          onChange={(e) => updateRate(type, 15, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-yellow-300 font-bold focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                💡 Tip: When using Cowork, just say "update rates" and Claude will edit this file directly.
              </p>
            </div>
          )}
        </div>

        {/* Loan Type Selector */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
          {["VA", "FHA", "Conventional"].map((type) => (
            <button
              key={type}
              onClick={() => setLoanType(type)}
              className={`relative px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                loanType === type
                  ? "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-900/50"
                  : "bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-blue-500"
              }`}
            >
              {type === "VA" && (
                <svg viewBox="0 0 24 16" className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="16" fill="#B22234"/>
                  <rect y="1.23" width="24" height="1.23" fill="white"/>
                  <rect y="3.69" width="24" height="1.23" fill="white"/>
                  <rect y="6.15" width="24" height="1.23" fill="white"/>
                  <rect y="8.62" width="24" height="1.23" fill="white"/>
                  <rect y="11.08" width="24" height="1.23" fill="white"/>
                  <rect y="13.54" width="24" height="1.23" fill="white"/>
                  <rect width="9.6" height="8.62" fill="#3C3B6E"/>
                  <g fill="white">
                    <circle cx="1.2" cy="1.4" r="0.3"/>
                    <circle cx="3" cy="1.4" r="0.3"/>
                    <circle cx="4.8" cy="1.4" r="0.3"/>
                    <circle cx="6.6" cy="1.4" r="0.3"/>
                    <circle cx="8.4" cy="1.4" r="0.3"/>
                    <circle cx="2.1" cy="2.6" r="0.3"/>
                    <circle cx="3.9" cy="2.6" r="0.3"/>
                    <circle cx="5.7" cy="2.6" r="0.3"/>
                    <circle cx="7.5" cy="2.6" r="0.3"/>
                    <circle cx="1.2" cy="3.8" r="0.3"/>
                    <circle cx="3" cy="3.8" r="0.3"/>
                    <circle cx="4.8" cy="3.8" r="0.3"/>
                    <circle cx="6.6" cy="3.8" r="0.3"/>
                    <circle cx="8.4" cy="3.8" r="0.3"/>
                    <circle cx="2.1" cy="5" r="0.3"/>
                    <circle cx="3.9" cy="5" r="0.3"/>
                    <circle cx="5.7" cy="5" r="0.3"/>
                    <circle cx="7.5" cy="5" r="0.3"/>
                    <circle cx="1.2" cy="6.2" r="0.3"/>
                    <circle cx="3" cy="6.2" r="0.3"/>
                    <circle cx="4.8" cy="6.2" r="0.3"/>
                    <circle cx="6.6" cy="6.2" r="0.3"/>
                    <circle cx="8.4" cy="6.2" r="0.3"/>
                    <circle cx="2.1" cy="7.4" r="0.3"/>
                    <circle cx="3.9" cy="7.4" r="0.3"/>
                    <circle cx="5.7" cy="7.4" r="0.3"/>
                    <circle cx="7.5" cy="7.4" r="0.3"/>
                  </g>
                </svg>
              )}
              {type} Loan
              {loanType === type && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* LEFT: Inputs */}
          <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-blue-900/50 p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-400" />
              <span>Loan Details</span>
            </h2>

            {/* Home Price */}
            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-blue-200 mb-2">
                <span>Home Price</span>
                <span className="text-yellow-400 font-bold">{formatCurrency(homePrice)}</span>
              </label>
              <input
                type="range"
                min="50000"
                max="1500000"
                step="5000"
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <input
                type="number"
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Down Payment */}
            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-blue-200 mb-2">
                <span>Down Payment</span>
                <span className="text-yellow-400 font-bold">
                  {formatCurrency(downPayment)} ({downPaymentPercent}%)
                </span>
              </label>
              <input
                type="range"
                min="0"
                max={homePrice * 0.5}
                step="1000"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              {loanType === "VA" && downPayment === 0 && (
                <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                  <Star className="w-3 h-3" /> $0 Down — VA Loan Benefit
                </div>
              )}
            </div>

            {/* Loan Term */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-blue-200 mb-2 block">Loan Term</label>
              <div className="grid grid-cols-2 gap-2">
                {[30, 15].map((term) => (
                  <button
                    key={term}
                    onClick={() => setLoanTerm(term)}
                    className={`py-2.5 rounded-lg font-bold transition-all ${
                      loanTerm === term
                        ? "bg-blue-700 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-blue-500"
                    }`}
                  >
                    {term} Years
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-blue-200 mb-2">
                <span>Interest Rate</span>
                <span className="text-yellow-400 font-bold">{interestRate}%</span>
              </label>
              <input
                type="range"
                min="3"
                max="10"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-xs text-slate-400 mt-1">Today's avg {loanType} {loanTerm}-yr fixed</p>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline"
            >
              {showBreakdown ? "▲ Hide" : "▼ Show"} Tax, Insurance & HOA
            </button>

            {showBreakdown && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <div>
                  <label className="flex justify-between text-sm font-semibold text-blue-200 mb-2">
                    <span>Property Tax Rate</span>
                    <span className="text-yellow-400 font-bold">{propertyTaxRate}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.05"
                    value={propertyTaxRate}
                    onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-200 mb-2 block">Annual Homeowners Insurance</label>
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blue-200 mb-2 block">Monthly HOA Dues</label>
                  <input
                    type="number"
                    value={hoaDues}
                    onChange={(e) => setHoaDues(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Results */}
          <div className="bg-gradient-to-br from-blue-950 to-slate-900 rounded-2xl border border-blue-700/50 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Decorative shield watermark */}
            <Shield className="absolute -right-10 -top-10 w-64 h-64 text-blue-800/10" />

            <div className="relative">
              <p className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-2">
                Your Estimated Monthly Payment
              </p>
              <div className="text-5xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                {formatCurrency(animatedPayment)}
              </div>
              <p className="text-blue-200 text-sm">/ month total PITI</p>

              {/* Pie chart */}
              <div className="my-8 flex flex-col sm:flex-row items-center gap-6">
                <svg viewBox="0 0 200 200" className="w-48 h-48 transform -rotate-0 drop-shadow-2xl">
                  {slices.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.path}
                      fill={slice.color}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  ))}
                  <circle cx="100" cy="100" r="38" fill="#0f172a" />
                  <text x="100" y="95" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">
                    Monthly
                  </text>
                  <text x="100" y="110" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                    Breakdown
                  </text>
                </svg>

                {/* Legend */}
                <div className="flex-1 space-y-2 w-full">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                        <span className="text-blue-100">{d.label}</span>
                      </div>
                      <span className="font-bold text-white">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loan summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase">Loan Amount</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(calculations.loanAmount)}</p>
                </div>
                <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase">Total Interest</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(calculations.totalInterest)}</p>
                </div>
              </div>

              {/* VA Benefits Banner */}
              {loanType === "VA" && (
                <div className="bg-gradient-to-r from-red-900/50 to-blue-900/50 border border-red-500/30 rounded-xl p-4 mb-6 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-yellow-400">VA Loan Benefits Active</h3>
                  </div>
                  <ul className="text-xs sm:text-sm text-blue-100 space-y-1">
                    <li>✓ $0 down payment required</li>
                    <li>✓ No PMI (saves ~${Math.round(calculations.loanAmount * 0.005 / 12)}/mo)</li>
                    <li>✓ Funding fee can be waived for disabled veterans</li>
                    <li>✓ Lower rates than conventional loans</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          <a
            href="https://icmortgage.icmtg.com/dr/c/24m5r"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 transition-all transform hover:scale-105"
          >
            <FileText className="w-5 h-5" />
            <span>Start My Application</span>
          </a>
          <a
            href="tel:7572321938"
            className="group bg-blue-800 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-105 border border-blue-600"
          >
            <Phone className="w-5 h-5" />
            <span>Call John: 757-232-1938</span>
          </a>
          <a
            href="sms:7572321938"
            className="group bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-105 border border-slate-600"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Text Me Now</span>
          </a>
        </div>

        {/* Trust block */}
        <div className="mt-10 bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-blue-900/50 p-6 text-center">
          <div className="flex justify-center mb-3">
            <img src="/john-headshot.jpg" alt="John Barrs"
              className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow-lg" />
          </div>
          <h3 className="text-xl font-bold mb-2">John Barrs, Senior Loan Officer</h3>
          <p className="text-blue-300 text-sm mb-3">Navy SEAL Veteran · Retired Deputy Fire Chief · Emmy-Nominated TV Host</p>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Two careers spent serving this country and community. Now serving the families,
            veterans, and first responders of Middle Tennessee — 7 days a week.
          </p>
        </div>

        {/* Compliance footer */}
        <div className="mt-8 text-xs text-slate-400 text-center space-y-2 leading-relaxed border-t border-slate-800 pt-6">
          <p className="font-semibold text-slate-300">
            John Barrs · Branch Manager / Senior Loan Officer · Intercoastal Mortgage
          </p>
          <p>
            NMLS #2544471 · Intercoastal Mortgage, LLC Company NMLS #56323 · Licensed in TN, KY, FL, NC, and VA
          </p>
          <p className="max-w-3xl mx-auto">
            This calculator provides estimates only and is not a commitment to lend or a guarantee
            of any specific rate, fee, or term. Actual loan terms depend on credit, income,
            property type, and other underwriting factors. Rates shown reflect today's market
            averages and are subject to change without notice. Contact John for a personalized quote.
          </p>
          <p className="pt-2 flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            <span>Equal Housing Opportunity Lender</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}