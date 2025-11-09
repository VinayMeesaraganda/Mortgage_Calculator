# Mortgage Calculator - Complete Guide

A comprehensive, feature-rich mortgage calculator with investment property analysis, currency support, and professional export capabilities.

🔗 **Live Demo:** https://mortgage-calculator-kappa-nine.vercel.app/

---

## ✨ Key Features

### Core Mortgage Calculations
- **Payment Frequency:** Monthly or Bi-weekly payments
- **Extra Payments:** Add recurring or one-time extra payments
- **Loan Comparison:** Compare multiple loan scenarios side-by-side
- **Refinance Analysis:** Evaluate refinancing opportunities with break-even calculations

### Investment Property Analysis
- **Cash Flow Analysis:** Monthly and annual cash flow projections
- **ROI Metrics:** CAP rate, Cash-on-Cash return
- **Operating Expenses:** Property management, maintenance, utilities, vacancy rate
- **Future Projections:** 5, 10, and 15-year rental income forecasts

### International Support (6 Currencies)
- **USD** ($) - US Dollar
- **CAD** (C$) - Canadian Dollar
- **GBP** (£) - British Pound
- **EUR** (€) - Euro
- **AUD** (A$) - Australian Dollar
- **INR** (₹) - Indian Rupee

**Note:** Currency selector changes symbols only, no value conversion.

### Current Mortgage Rates
- Real-time rates for 15-year, 30-year fixed mortgages
- ARM rates (5/1 and 7/1)
- Country-specific rates
- Click-to-apply functionality

### Export & Sharing
- **Excel Export:** Complete report with charts and multiple sheets
- **PDF Export:** Professional printable reports
- **CSV Export:** Amortization schedule data
- **Email Results:** Send reports directly to inbox
- **Social Sharing:** Share savings with compelling messages

### Mobile Responsive
- Fully responsive design (mobile-first)
- Card-based mobile layout for amortization schedule
- Touch-friendly controls
- Optimized for all screen sizes

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "Mortgage Caalculator"

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Technology Stack
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **ExcelJS** for Excel export
- **jsPDF** for PDF generation
- **Lucide React** for icons

---

## 📊 Features in Detail

### 1. Payment Comparison
Compare monthly vs bi-weekly payments:
- See interest savings
- Calculate time saved
- Visual comparison charts
- Automatic calculations

### 2. Additional Costs
Include all housing costs:
- Property tax (annual/monthly)
- Home insurance
- PMI (if applicable)
- HOA fees
- See true monthly housing cost

### 3. Amortization Schedule
- Complete payment breakdown
- Group by year, month, or individual payments
- Export to CSV
- Mobile-friendly card view

### 4. Investment Property Tools
Comprehensive analysis including:
- Monthly rental income with vacancy rate
- Operating expense tracking
- Property management fees
- NOI (Net Operating Income)
- CAP rate calculation
- Cash-on-Cash return
- Break-even occupancy
- Property appreciation projections

### 5. Scenario Comparison
Compare up to 3 different loan scenarios:
- Different home values
- Different down payments
- Different interest rates
- Different loan terms
- Side-by-side comparison

### 6. Refinance Calculator
Evaluate refinancing options:
- Current loan vs new loan comparison
- Break-even analysis
- Total savings calculation
- Monthly payment difference
- Closing costs included

---

## 🎨 User Interface

### Design Principles
- **Clean & Modern:** Professional gradient designs
- **Intuitive:** Clear labels and helpful tooltips
- **Responsive:** Works perfectly on all devices
- **Accessible:** ARIA labels and keyboard navigation
- **Fast:** Optimized performance with React memoization

### Color Scheme
- Primary: Blue gradients
- Investment: Green gradients
- Warnings: Red/Orange
- Success: Emerald/Green
- Neutral: Slate grays

---

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Mobile:** < 640px (card layouts)
- **Tablet:** 640px - 1024px
- **Desktop:** 1024px+

### Mobile Features
- Collapsible sections
- Touch-friendly buttons (48px minimum)
- Swipeable cards
- Optimized font sizes
- Reduced animations for performance

---

## 💾 Data Export

### Excel Export (XLSX)
Includes multiple sheets:
1. **Primary Mortgage:** Full amortization with chart
2. **Investment Analysis:** (if property type is investment)
3. **Loan Comparison:** (if comparing scenarios)
4. **Refinance Analysis:** (if analyzing refinance)

### PDF Export
Professional report with:
- Loan details summary
- Payment breakdown
- Additional costs
- Amortization table (first 12 payments)
- Multi-page support

### CSV Export
- Raw amortization schedule data
- Compatible with Excel, Google Sheets
- All payment details included

---

## 🌍 SEO Optimization

### Keywords Targeted
- Primary: "mortgage calculator", "home loan calculator"
- Secondary: "bi-weekly mortgage calculator", "investment property calculator"
- Long-tail: "mortgage calculator with property tax", "ARM calculator"
- Geographic: "mortgage calculator CAD", "UK mortgage calculator"

### Meta Tags
- Complete Open Graph tags
- Twitter Card support
- Proper title and description
- Keywords meta tag

### Structured Data
- WebApplication schema
- FAQPage schema
- Organization schema
- BreadcrumbList schema

---

## 🔧 Technical Details

### Performance Optimizations
- React.memo for components
- useCallback for functions
- useMemo for expensive calculations
- Lazy loading ready
- Tree-shaking enabled

### State Management
- React useState hooks
- Custom hooks for inputs
- Global currency state
- Optimized re-renders

### Bundle Size
- Main bundle: ~2,065 kB
- Gzipped: ~595 kB
- Code splitting available

---

## 🐛 Known Issues & Solutions

### Issue: Currency symbols not updating
**Solution:** Force re-render with currency key (already implemented)

### Issue: PDF downloading as .txt
**Solution:** Use jsPDF library (already implemented)

### Issue: Mobile table hard to read
**Solution:** Card-based layout for mobile (already implemented)

---

## 📈 Future Enhancements

### Priority 1
- [ ] Live mortgage rate API integration
- [ ] User accounts with saved calculations
- [ ] Mortgage affordability calculator

### Priority 2
- [ ] Full ARM calculator with adjustment schedule
- [ ] Mortgage comparison with multiple lenders
- [ ] Payment calendar view

### Priority 3
- [ ] Cryptocurrency support
- [ ] Multi-language support
- [ ] Dark mode

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

[Your License Here]

---

## 🙏 Credits

Built with:
- React
- TypeScript
- Tailwind CSS
- Recharts
- ExcelJS
- jsPDF

---

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Last Updated:** November 9, 2025
**Version:** 3.0 (Phase 3 - International Currency Support)

