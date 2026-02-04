import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Calculator,
  Home,
  TrendingUp,
  Globe,
  FileSpreadsheet,
  Smartphone,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X,
  DollarSign,
  PieChart,
  BarChart3,
  Download,
  Mail,
  Share2,
  ChevronDown,
} from 'lucide-react';
import './index.css';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Calculator,
      title: 'Core Mortgage Calculations',
      description: 'Monthly & bi-weekly payments, extra payments, loan comparison, and refinance analysis.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'Investment Property Analysis',
      description: 'Cash flow projections, ROI metrics, CAP rate, Cash-on-Cash return, and future projections.',
      gradient: 'from-blue-600 to-blue-700',
    },
    {
      icon: Globe,
      title: '6 Currency Support',
      description: 'Support for USD, CAD, GBP, EUR, AUD, and INR for global accessibility.',
      gradient: 'from-blue-400 to-blue-500',
    },
    {
      icon: BarChart3,
      title: 'Real-time Mortgage Rates',
      description: 'Access 15-year, 30-year fixed rates, and ARM rates (5/1, 7/1) in real-time.',
      gradient: 'from-blue-700 to-blue-800',
    },
    {
      icon: FileSpreadsheet,
      title: 'Export & Sharing',
      description: 'Export to Excel, PDF, CSV formats. Email results and share on social media.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Works perfectly on all devices - desktop, tablet, and mobile.',
      gradient: 'from-blue-600 to-blue-700',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'First-time Homebuyer',
      content: 'This calculator helped me understand exactly what I could afford. The breakdown of payments and amortization schedule was incredibly helpful!',
      rating: 5,
      avatar: 'SM',
    },
    {
      name: 'Michael R.',
      role: 'Real Estate Investor',
      content: 'The investment property analysis feature is a game-changer. I can quickly evaluate deals and project ROI for the next 15 years.',
      rating: 5,
      avatar: 'MR',
    },
    {
      name: 'Jennifer L.',
      role: 'Financial Planner',
      content: 'I recommend this tool to all my clients. The multi-currency support and export features make my job so much easier.',
      rating: 5,
      avatar: 'JL',
    },
  ];

  const currencies = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'INR'];

  const stats = [
    { value: '50K+', label: 'Calculations Made' },
    { value: '10K+', label: 'Happy Users' },
    { value: '99.9%', label: 'Accuracy Rate' },
    { value: '6', label: 'Currencies Supported' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                Mortgage Calculator
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}>
                Features
              </a>
              <a href="#testimonials" className={`font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}>
                Testimonials
              </a>
              <a
                href="https://mortgage-calculator-kappa-nine.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-6 py-2.5 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                Try Calculator
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t shadow-xl"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Features
              </a>
              <a href="#testimonials" className="block text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Testimonials
              </a>
              <a
                href="https://mortgage-calculator-kappa-nine.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center px-6 py-3 rounded-xl font-semibold"
              >
                Try Calculator
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen hero-gradient overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 min-h-screen flex flex-col justify-center"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6 border border-white/20">
                  <Shield className="w-4 h-4 mr-2" />
                  Trusted by 10,000+ users worldwide
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6"
              >
                Calculate Your
                <span className="block text-blue-200">Dream Home</span>
                <span className="block">Mortgage</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Make informed decisions with our comprehensive mortgage calculator. 
                Analyze payments, compare loans, and plan your financial future with confidence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <a
                  href="https://mortgage-calculator-kappa-nine.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-2xl hover:shadow-white/25 pulse-glow"
                >
                  Try Calculator Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  Learn More
                  <ChevronDown className="ml-2 w-5 h-5" />
                </a>
              </motion.div>

              {/* Currency badges */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                {currencies.map((currency, index) => (
                  <span
                    key={currency}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/90 text-sm font-medium border border-white/20"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {currency}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Calculator Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-2xl opacity-30" />
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Mortgage Calculator</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                      <label className="text-sm text-gray-600 block mb-2">Home Price</label>
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-2xl font-bold text-gray-800">450,000</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="text-xs text-gray-500 block mb-1">Down Payment</label>
                        <span className="text-lg font-bold text-gray-800">20%</span>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="text-xs text-gray-500 block mb-1">Interest Rate</label>
                        <span className="text-lg font-bold text-gray-800">6.5%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
                      <label className="text-sm text-blue-100 block mb-2">Monthly Payment</label>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold">$2,275</span>
                        <PieChart className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-white/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              Powerful Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className="block gradient-text">Make Smart Decisions</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive suite of tools helps homebuyers, investors, and financial planners 
              make informed mortgage decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature-card rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
              <Clock className="w-4 h-4 mr-2" />
              Quick & Easy
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your mortgage calculation in just three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Enter Details',
                description: 'Input your home price, down payment, interest rate, and loan term.',
                icon: Calculator,
              },
              {
                step: '02',
                title: 'Analyze Results',
                description: 'View detailed breakdown of payments, amortization, and projections.',
                icon: BarChart3,
              },
              {
                step: '03',
                title: 'Export & Share',
                description: 'Download reports in Excel, PDF, or CSV format. Share via email.',
                icon: Download,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="text-8xl font-bold text-blue-100 absolute -top-6 left-1/2 transform -translate-x-1/2 select-none">
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Loved by Users
              <span className="block gradient-text">Worldwide</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what our users are saying about their experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Export Features Section */}
      <section className="py-20 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                <Share2 className="w-4 h-4 mr-2" />
                Export & Share
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Share Your Results
                <span className="block gradient-text">Anywhere</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Export your mortgage calculations in multiple formats and share them with 
                your financial advisor, family, or colleagues.
              </p>

              <div className="space-y-4">
                {[
                  { icon: FileSpreadsheet, text: 'Export to Excel (XLSX)' },
                  { icon: FileSpreadsheet, text: 'Download as PDF' },
                  { icon: FileSpreadsheet, text: 'Export to CSV' },
                  { icon: Mail, text: 'Email Results' },
                  { icon: Share2, text: 'Share on Social Media' },
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{item.text}</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-2xl opacity-20" />
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  {['XLSX', 'PDF', 'CSV'].map((format) => (
                    <div key={format} className="text-center p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                      <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <span className="font-semibold text-gray-800">{format}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white text-center">
                  <p className="font-semibold">Export your complete mortgage analysis</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Calculate Your
              <span className="block text-blue-200">Mortgage?</span>
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Start making informed decisions about your home purchase today. 
              It's free, fast, and incredibly accurate.
            </p>
            <a
              href="https://mortgage-calculator-kappa-nine.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center bg-white text-blue-700 px-10 py-5 rounded-full font-bold text-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-white/25"
            >
              Start Calculating Now
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Mortgage Calculator</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                The most comprehensive mortgage calculator for homebuyers, investors, 
                and financial professionals. Make informed decisions about your financial future.
              </p>
              <div className="flex space-x-3">
                {currencies.map((currency) => (
                  <span key={currency} className="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-400">
                    {currency}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li>Mortgage Calculator</li>
                <li>Investment Analysis</li>
                <li>Refinance Calculator</li>
                <li>Amortization Schedule</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Export Options</h4>
              <ul className="space-y-3 text-gray-400">
                <li>Excel Export</li>
                <li>PDF Reports</li>
                <li>CSV Download</li>
                <li>Email Sharing</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              2025 Mortgage Calculator. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-gray-500 text-sm">Secure & Accurate Calculations</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
