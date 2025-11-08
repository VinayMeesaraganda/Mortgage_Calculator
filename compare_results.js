// Compare baseline vs optimized results
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync('./test_results_baseline.json', 'utf8'));

// Expected results from current run
const current = [
  {
    "name": "Test 1: Basic Monthly Payment (30-year)",
    "loanAmount": "320000.00",
    "paymentAmount": "2022.62",
    "totalPayments": 360,
    "totalPaid": "728142.36",
    "totalInterest": "408142.36",
    "endDate": "2054-12",
    "yearsToPayoff": "30.00"
  },
  {
    "name": "Test 2: Basic Bi-weekly Payment (30-year)",
    "loanAmount": "320000.00",
    "paymentAmount": "1011.31",
    "totalPayments": 625,
    "totalPaid": "631695.06",
    "totalInterest": "311695.06",
    "endDate": "2048-12",
    "yearsToPayoff": "24.04"
  },
  {
    "name": "Test 3: Monthly with $200 Recurring Extra Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "2022.62",
    "totalPayments": 281,
    "totalPaid": "622713.69",
    "totalInterest": "302713.69",
    "endDate": "2048-05",
    "yearsToPayoff": "23.42"
  },
  {
    "name": "Test 4: Bi-weekly with $100 Recurring Extra Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "1011.31",
    "totalPayments": 509,
    "totalPaid": "564789.72",
    "totalInterest": "244789.72",
    "endDate": "2044-06",
    "yearsToPayoff": "19.58"
  },
  {
    "name": "Test 5: Monthly with $5000 One-Time Payment (Year 2)",
    "loanAmount": "320000.00",
    "paymentAmount": "2022.62",
    "totalPayments": 345,
    "totalPaid": "702616.22",
    "totalInterest": "382616.22",
    "endDate": "2053-09",
    "yearsToPayoff": "28.75"
  },
  {
    "name": "Test 6: Bi-weekly with $10000 One-Time Payment (Year 3)",
    "loanAmount": "320000.00",
    "paymentAmount": "1011.31",
    "totalPayments": 586,
    "totalPaid": "602590.19",
    "totalInterest": "282590.19",
    "endDate": "2047-06",
    "yearsToPayoff": "22.54"
  },
  {
    "name": "Test 7: Monthly with Multiple One-Time Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "2022.62",
    "totalPayments": 333,
    "totalPaid": "683489.66",
    "totalInterest": "363489.66",
    "endDate": "2052-09",
    "yearsToPayoff": "27.75"
  },
  {
    "name": "Test 8: Bi-weekly with Multiple One-Time Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "1011.31",
    "totalPayments": 586,
    "totalPaid": "601645.86",
    "totalInterest": "281645.86",
    "endDate": "2047-06",
    "yearsToPayoff": "22.54"
  },
  {
    "name": "Test 9: Monthly with Recurring ($150) + One-Time Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "2022.62",
    "totalPayments": 273,
    "totalPaid": "603989.93",
    "totalInterest": "283989.93",
    "endDate": "2047-09",
    "yearsToPayoff": "22.75"
  },
  {
    "name": "Test 10: Bi-weekly with Recurring ($75) + One-Time Payments",
    "loanAmount": "320000.00",
    "paymentAmount": "1011.31",
    "totalPayments": 512,
    "totalPaid": "562630.59",
    "totalInterest": "242630.59",
    "endDate": "2044-08",
    "yearsToPayoff": "19.69"
  }
];

console.log('\n🔍 COMPARING BASELINE VS. OPTIMIZED RESULTS\n');
console.log('='.repeat(80));

let allMatch = true;
let mismatchCount = 0;

baseline.forEach((baseTest, index) => {
  const currTest = current[index];
  const matches = JSON.stringify(baseTest) === JSON.stringify(currTest);
  
  if (matches) {
    console.log(`\n✅ ${baseTest.name}`);
    console.log('   All values match perfectly!');
  } else {
    allMatch = false;
    mismatchCount++;
    console.log(`\n❌ ${baseTest.name}`);
    console.log('   MISMATCH DETECTED:');
    
    Object.keys(baseTest).forEach(key => {
      if (baseTest[key] !== currTest[key]) {
        console.log(`   - ${key}:`);
        console.log(`     Baseline:  ${baseTest[key]}`);
        console.log(`     Current:   ${currTest[key]}`);
      }
    });
  }
});

console.log('\n' + '='.repeat(80));

if (allMatch) {
  console.log('\n🎉 SUCCESS! All 10 test cases match exactly!');
  console.log('✅ Optimization completed without breaking any calculations.\n');
} else {
  console.log(`\n⚠️  WARNING: ${mismatchCount} test case(s) have mismatches!`);
  console.log('❌ Review the differences above.\n');
}

