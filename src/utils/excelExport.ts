import ExcelJS from 'exceljs';
import type { ScheduleItem } from '../types/mortgage';
import { formatCurrency, formatDate } from './formatting';

interface PrimaryMortgageData {
  homeValue: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  tenure: number;
  paymentAmount: number;
  totalInterest: number;
  totalPaid: number;
  endDate: string;
  schedule: ScheduleItem[];
  chartData: Array<{
    date: string;
    balance: number;
    principal: number;
    interest: number;
    cumulative: number;
  }>;
  paymentType: 'monthly' | 'biweekly';
  extraPaymentEnabled: boolean;
  extraPaymentAmount: number;
}

interface InvestmentPropertyData {
  monthlyRent: number;
  vacancyRate: number;
  effectiveMonthlyRent: number;
  propertyManagementPercent: number;
  maintenance: number;
  utilities: number;
  propertyAppreciationRate: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  breakEvenOccupancy: number;
  netOperatingIncome: number;
  totalOperatingExpenses: number;
  futureMonthlyRent5Year: number;
  futureMonthlyRent10Year: number;
  futureMonthlyRent15Year: number;
  // Include primary mortgage data for context
  primaryData: PrimaryMortgageData;
}

interface CompareLoansData {
  currentScenario: {
    homeValue: number;
    downPayment: number;
    interestRate: number;
    tenure: number;
    paymentType: 'monthly' | 'biweekly';
    loanAmount: number;
    payment: number;
    totalInterest: number;
    totalPaid: number;
    tenureYears: number;
  };
  scenarioB: {
    homeValue: number;
    downPayment: number;
    interestRate: number;
    tenure: number;
    paymentType: 'monthly' | 'biweekly';
    loanAmount: number;
    payment: number;
    totalInterest: number;
    totalPaid: number;
    tenureYears: number;
  };
  scenarioC: {
    homeValue: number;
    downPayment: number;
    interestRate: number;
    tenure: number;
    paymentType: 'monthly' | 'biweekly';
    loanAmount: number;
    payment: number;
    totalInterest: number;
    totalPaid: number;
    tenureYears: number;
  };
  comparisonBarData: Array<{
    name: string;
    interest: number;
    type: string;
    label: string;
    endDate: string;
  }>;
}

interface RefinanceData {
  currentLoan: {
    remainingBalance: number;
    currentRate: number;
    currentPayment: number;
    currentMonthlyTotal: number;
    currentTotalPayments: number;
    currentTotalInterest: number;
    remainingMonths: number;
  };
  newLoan: {
    newRate: number;
    newPayment: number;
    newMonthlyTotal: number;
    newTotalPayments: number;
    newTotalInterest: number;
    actualNewMonths: number;
    closingCosts: number;
    newTerm: number;
  };
  savings: {
    monthlySavings: number;
    totalSavings: number;
    interestSavings: number;
    breakEvenMonths: number;
    breakEvenYears: number;
    timeDifference: number;
    worthIt: boolean;
  };
}

export async function exportToExcel(
  primaryData: PrimaryMortgageData,
  investmentData?: InvestmentPropertyData,
  compareLoansData?: CompareLoansData,
  refinanceData?: RefinanceData
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mortgage Calculator';
  workbook.created = new Date();

  // Sheet 1: Primary Mortgage
  const primarySheet = workbook.addWorksheet('Primary Mortgage');
  createPrimaryMortgageSheet(primarySheet, primaryData);

  // Sheet 2: Investment Property (if available)
  if (investmentData) {
    const investmentSheet = workbook.addWorksheet('Investment Property');
    createInvestmentPropertySheet(investmentSheet, investmentData);
  }

  // Sheet 3: Compare Loans (if available)
  if (compareLoansData) {
    const compareSheet = workbook.addWorksheet('Compare Loans');
    createCompareLoansSheet(compareSheet, compareLoansData);
  }

  // Sheet 4: Refinance (if available)
  if (refinanceData) {
    const refinanceSheet = workbook.addWorksheet('Refinance');
    createRefinanceSheet(refinanceSheet, refinanceData);
  }

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Mortgage_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function createPrimaryMortgageSheet(sheet: ExcelJS.Worksheet, data: PrimaryMortgageData) {
  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Primary Mortgage Report';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // Summary Section
  let row = 3;
  sheet.getCell(`A${row}`).value = 'Loan Summary';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const summaryData = [
    ['Home Value', formatCurrency(data.homeValue)],
    ['Down Payment', formatCurrency(data.downPayment)],
    ['Loan Amount', formatCurrency(data.loanAmount)],
    ['Interest Rate', `${data.interestRate}%`],
    ['Loan Term', `${data.tenure} years`],
    ['Payment Type', data.paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'],
    ['Monthly Payment', formatCurrency(data.paymentAmount)],
    ['Total Interest Paid', formatCurrency(data.totalInterest)],
    ['Total Amount Paid', formatCurrency(data.totalPaid)],
    ['Payoff Date', formatDate(data.endDate)],
  ];

  if (data.extraPaymentEnabled && data.extraPaymentAmount > 0) {
    summaryData.push(['Extra Payment', formatCurrency(data.extraPaymentAmount)]);
  }

  summaryData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Chart Data
  sheet.getCell(`A${row}`).value = 'Amortization Chart Data';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  // Headers
  const chartHeaders = ['Date', 'Remaining Balance', 'Principal Paid', 'Cumulative Interest', 'Total Paid'];
  chartHeaders.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  // Chart data rows
  data.chartData.forEach((item) => {
    sheet.getCell(row, 1).value = item.date;
    sheet.getCell(row, 2).value = item.balance;
    sheet.getCell(row, 2).numFmt = '$#,##0.00';
    sheet.getCell(row, 3).value = item.principal;
    sheet.getCell(row, 3).numFmt = '$#,##0.00';
    sheet.getCell(row, 4).value = item.interest;
    sheet.getCell(row, 4).numFmt = '$#,##0.00';
    sheet.getCell(row, 5).value = item.cumulative;
    sheet.getCell(row, 5).numFmt = '$#,##0.00';
    row++;
  });

  // Note: Chart data is exported above. Users can create charts in Excel using the data.
  // To create a chart: Select the data range, go to Insert > Chart, and choose Line Chart.

  row += 25;

  // Amortization Schedule
  sheet.getCell(`A${row}`).value = 'Amortization Schedule';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const scheduleHeaders = ['Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Total Interest'];
  scheduleHeaders.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  // Limit schedule to first 1000 rows for performance
  const scheduleToExport = data.schedule.slice(0, 1000);
  scheduleToExport.forEach((item) => {
    sheet.getCell(row, 1).value = item.date;
    sheet.getCell(row, 2).value = item.payment;
    sheet.getCell(row, 2).numFmt = '$#,##0.00';
    sheet.getCell(row, 3).value = item.principal;
    sheet.getCell(row, 3).numFmt = '$#,##0.00';
    sheet.getCell(row, 4).value = item.interest;
    sheet.getCell(row, 4).numFmt = '$#,##0.00';
    sheet.getCell(row, 5).value = item.balance;
    sheet.getCell(row, 5).numFmt = '$#,##0.00';
    sheet.getCell(row, 6).value = item.totalInterest;
    sheet.getCell(row, 6).numFmt = '$#,##0.00';
    row++;
  });

  // Auto-size columns
  sheet.columns.forEach((column) => {
    if (column && column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      if (column.width !== undefined) {
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    }
  });
}

function createInvestmentPropertySheet(sheet: ExcelJS.Worksheet, data: InvestmentPropertyData) {
  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Investment Property Analysis';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF059669' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  let row = 3;

  // Rental Income Section
  sheet.getCell(`A${row}`).value = 'Rental Income';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const rentalData = [
    ['Monthly Rent', formatCurrency(data.monthlyRent)],
    ['Vacancy Rate', `${data.vacancyRate}%`],
    ['Effective Monthly Rent', formatCurrency(data.effectiveMonthlyRent)],
    ['Annual Rent (Effective)', formatCurrency(data.effectiveMonthlyRent * 12)],
  ];

  rentalData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Operating Expenses
  sheet.getCell(`A${row}`).value = 'Operating Expenses';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const expensesData = [
    ['Property Management', `${data.propertyManagementPercent}% of rent`],
    ['Property Management Fee', formatCurrency(data.monthlyRent * (data.propertyManagementPercent / 100))],
    ['Maintenance & Repairs', formatCurrency(data.maintenance)],
    ['Utilities', formatCurrency(data.utilities)],
    ['Total Operating Expenses (Monthly)', formatCurrency(data.totalOperatingExpenses)],
    ['Total Operating Expenses (Annual)', formatCurrency(data.totalOperatingExpenses * 12)],
  ];

  expensesData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Investment KPIs
  sheet.getCell(`A${row}`).value = 'Investment KPIs';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const kpiData = [
    ['Monthly Cash Flow', formatCurrency(data.monthlyCashFlow)],
    ['Annual Cash Flow', formatCurrency(data.annualCashFlow)],
    ['Cash-on-Cash Return', `${data.cashOnCashReturn.toFixed(2)}%`],
    ['Cap Rate', `${data.capRate.toFixed(2)}%`],
    ['Net Operating Income (NOI)', formatCurrency(data.netOperatingIncome)],
    ['Break-Even Occupancy', `${data.breakEvenOccupancy.toFixed(2)}%`],
  ];

  kpiData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Projections
  sheet.getCell(`A${row}`).value = 'Rental Income Projections';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const projectionsData = [
    ['Current Monthly Rent', formatCurrency(data.monthlyRent)],
    ['5-Year Projected Rent', formatCurrency(data.futureMonthlyRent5Year)],
    ['10-Year Projected Rent', formatCurrency(data.futureMonthlyRent10Year)],
    ['15-Year Projected Rent', formatCurrency(data.futureMonthlyRent15Year)],
    ['Property Appreciation Rate', `${data.propertyAppreciationRate}%`],
  ];

  projectionsData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  // Chart Data for Cash Flow Projection
  row += 2;
  sheet.getCell(`A${row}`).value = 'Cash Flow Projection Chart Data';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const chartHeaders = ['Year', 'Monthly Rent', 'Monthly Expenses', 'Monthly Cash Flow', 'Annual Cash Flow'];
  chartHeaders.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  // Generate 10-year projection
  for (let year = 0; year <= 10; year++) {
    const projectedRent = data.monthlyRent * Math.pow(1 + data.propertyAppreciationRate / 100, year);
    const projectedExpenses = data.totalOperatingExpenses * Math.pow(1.03, year); // 3% expense growth
    const projectedCashFlow = projectedRent - data.primaryData.paymentAmount - projectedExpenses;
    
    sheet.getCell(row, 1).value = year;
    sheet.getCell(row, 2).value = projectedRent;
    sheet.getCell(row, 2).numFmt = '$#,##0.00';
    sheet.getCell(row, 3).value = projectedExpenses;
    sheet.getCell(row, 3).numFmt = '$#,##0.00';
    sheet.getCell(row, 4).value = projectedCashFlow;
    sheet.getCell(row, 4).numFmt = '$#,##0.00';
    sheet.getCell(row, 5).value = projectedCashFlow * 12;
    sheet.getCell(row, 5).numFmt = '$#,##0.00';
    row++;
  }

  // Note: Chart data is exported above. Users can create charts in Excel using the data.
  // To create a chart: Select the data range, go to Insert > Chart, and choose Line Chart.

  // Auto-size columns
  sheet.columns.forEach((column) => {
    if (column && column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      if (column.width !== undefined) {
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    }
  });
}

function createCompareLoansSheet(sheet: ExcelJS.Worksheet, data: CompareLoansData) {
  // Title
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Loan Comparison Analysis';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF7C3AED' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  let row = 3;

  // Comparison Table
  const headers = ['Metric', 'Current Scenario', 'Scenario B', 'Scenario C'];
  headers.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col === 0 ? 'FF7C3AED' : col === 1 ? 'FFF59E0B' : 'FF7C3AED' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  const comparisonRows = [
    ['Home Value', formatCurrency(data.currentScenario.homeValue), formatCurrency(data.scenarioB.homeValue), formatCurrency(data.scenarioC.homeValue)],
    ['Down Payment', formatCurrency(data.currentScenario.downPayment), formatCurrency(data.scenarioB.downPayment), formatCurrency(data.scenarioC.downPayment)],
    ['Loan Amount', formatCurrency(data.currentScenario.loanAmount), formatCurrency(data.scenarioB.loanAmount), formatCurrency(data.scenarioC.loanAmount)],
    ['Interest Rate', `${data.currentScenario.interestRate}%`, `${data.scenarioB.interestRate}%`, `${data.scenarioC.interestRate}%`],
    ['Loan Term', `${data.currentScenario.tenure} years`, `${data.scenarioB.tenure} years`, `${data.scenarioC.tenure} years`],
    ['Payment Type', data.currentScenario.paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly', data.scenarioB.paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly', data.scenarioC.paymentType === 'monthly' ? 'Monthly' : 'Bi-weekly'],
    ['Monthly Payment', formatCurrency(data.currentScenario.payment), formatCurrency(data.scenarioB.payment), formatCurrency(data.scenarioC.payment)],
    ['Total Interest Paid', formatCurrency(data.currentScenario.totalInterest), formatCurrency(data.scenarioB.totalInterest), formatCurrency(data.scenarioC.totalInterest)],
    ['Total Amount Paid', formatCurrency(data.currentScenario.totalPaid), formatCurrency(data.scenarioB.totalPaid), formatCurrency(data.scenarioC.totalPaid)],
    ['Time to Pay Off', `${data.currentScenario.tenureYears} years`, `${data.scenarioB.tenureYears} years`, `${data.scenarioC.tenureYears} years`],
  ];

  comparisonRows.forEach((rowData) => {
    rowData.forEach((value, col) => {
      const cell = sheet.getCell(row, col + 1);
      cell.value = value;
      if (col > 0 && typeof value === 'string' && value.includes('$')) {
        // Try to extract number for formatting
        const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numValue)) {
          cell.value = numValue;
          cell.numFmt = '$#,##0.00';
        }
      }
    });
    row++;
  });

  row += 2;

  // Savings Comparison
  sheet.getCell(`A${row}`).value = 'Savings vs Current';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const savingsB = data.currentScenario.totalInterest - data.scenarioB.totalInterest;
  const savingsC = data.currentScenario.totalInterest - data.scenarioC.totalInterest;

  const savingsData = [
    ['Scenario B Savings', formatCurrency(savingsB)],
    ['Scenario C Savings', formatCurrency(savingsC)],
  ];

  savingsData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Chart Data
  sheet.getCell(`A${row}`).value = 'Comparison Chart Data';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const chartHeaders = ['Scenario', 'Total Interest Paid', 'End Date'];
  chartHeaders.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  // Add all scenarios to chart data
  const chartDataRows = [
    ['Current', data.currentScenario.totalInterest, ''],
    ...data.comparisonBarData.map(item => [item.name, item.interest, item.endDate]),
  ];

  chartDataRows.forEach((rowData) => {
    sheet.getCell(row, 1).value = rowData[0];
    sheet.getCell(row, 2).value = rowData[1];
    sheet.getCell(row, 2).numFmt = '$#,##0.00';
    sheet.getCell(row, 3).value = rowData[2];
    row++;
  });

  // Note: Chart data is exported above. Users can create charts in Excel using the data.
  // To create a chart: Select the data range, go to Insert > Chart, and choose Bar Chart.

  // Auto-size columns
  sheet.columns.forEach((column) => {
    if (column && column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      if (column.width !== undefined) {
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    }
  });
}

function createRefinanceSheet(sheet: ExcelJS.Worksheet, data: RefinanceData) {
  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Refinance Analysis';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFF97316' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  let row = 3;

  // Current Loan
  sheet.getCell(`A${row}`).value = 'Current Loan Details';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const currentLoanData = [
    ['Remaining Balance', formatCurrency(data.currentLoan.remainingBalance)],
    ['Interest Rate', `${data.currentLoan.currentRate}%`],
    ['Monthly Payment', formatCurrency(data.currentLoan.currentPayment)],
    ['Total Monthly Payment', formatCurrency(data.currentLoan.currentMonthlyTotal)],
    ['Remaining Months', `${Math.ceil(data.currentLoan.remainingMonths)}`],
    ['Total Interest Remaining', formatCurrency(data.currentLoan.currentTotalInterest)],
    ['Total Payments Remaining', formatCurrency(data.currentLoan.currentTotalPayments)],
  ];

  currentLoanData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // New Loan
  sheet.getCell(`A${row}`).value = 'New Refinanced Loan Details';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const newLoanData = [
    ['New Interest Rate', `${data.newLoan.newRate}%`],
    ['New Loan Term', `${data.newLoan.newTerm} years`],
    ['New Monthly Payment', formatCurrency(data.newLoan.newPayment)],
    ['Total Monthly Payment', formatCurrency(data.newLoan.newMonthlyTotal)],
    ['Closing Costs', formatCurrency(data.newLoan.closingCosts)],
    ['Total Months', `${Math.ceil(data.newLoan.actualNewMonths)}`],
    ['Total Interest', formatCurrency(data.newLoan.newTotalInterest)],
    ['Total Payments', formatCurrency(data.newLoan.newTotalPayments)],
  ];

  newLoanData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    row++;
  });

  row += 2;

  // Savings Analysis
  sheet.getCell(`A${row}`).value = 'Savings Analysis';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const savingsData = [
    ['Monthly Savings', formatCurrency(data.savings.monthlySavings)],
    ['Total Savings', formatCurrency(data.savings.totalSavings)],
    ['Interest Savings', formatCurrency(data.savings.interestSavings)],
    ['Break-Even Months', `${Math.ceil(data.savings.breakEvenMonths)}`],
    ['Break-Even Years', `${data.savings.breakEvenYears.toFixed(2)}`],
    ['Time Difference', `${data.savings.timeDifference.toFixed(2)} years`],
    ['Worth Refinancing?', data.savings.worthIt ? 'Yes ✓' : 'No ✗'],
  ];

  savingsData.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = value;
    if (data.savings.worthIt && row === row) {
      sheet.getCell(`B${row}`).font = { color: { argb: 'FF059669' } };
    }
    row++;
  });

  row += 2;

  // Comparison Chart Data
  sheet.getCell(`A${row}`).value = 'Refinance Comparison Chart Data';
  sheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  const chartHeaders = ['Loan Type', 'Total Interest', 'Total Payments', 'Monthly Payment'];
  chartHeaders.forEach((header, col) => {
    const cell = sheet.getCell(row, col + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  row++;

  const comparisonData = [
    ['Current Loan', data.currentLoan.currentTotalInterest, data.currentLoan.currentTotalPayments, data.currentLoan.currentPayment],
    ['Refinanced Loan', data.newLoan.newTotalInterest, data.newLoan.newTotalPayments, data.newLoan.newPayment],
  ];

  comparisonData.forEach((rowData) => {
    sheet.getCell(row, 1).value = rowData[0];
    sheet.getCell(row, 2).value = rowData[1];
    sheet.getCell(row, 2).numFmt = '$#,##0.00';
    sheet.getCell(row, 3).value = rowData[2];
    sheet.getCell(row, 3).numFmt = '$#,##0.00';
    sheet.getCell(row, 4).value = rowData[3];
    sheet.getCell(row, 4).numFmt = '$#,##0.00';
    row++;
  });

  // Note: Chart data is exported above. Users can create charts in Excel using the data.
  // To create a chart: Select the data range, go to Insert > Chart, and choose Bar Chart.

  // Auto-size columns
  sheet.columns.forEach((column) => {
    if (column && column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      if (column.width !== undefined) {
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    }
  });
}

