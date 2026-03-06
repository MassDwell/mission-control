#!/usr/bin/env node

/**
 * Alpine Budget Tracker - Scale Beacon Budget to Sumner Dimensions
 * Takes Beacon template and scales it to Sumner Street 191 sizing
 */

const fs = require('fs');
const path = require('path');

// Beacon reference budget (template)
const beaconBudget = {
  project: "Beacon Template",
  units: 34,
  gross_sf: 74424,
  sellable_sf: 55818,
  budget_items: [
    { category: "Land/Site Acquisition", budgeted: 10000000, section: "HARD COSTS" },
    { category: "Utilities & Site Work", budgeted: 150000, section: "HARD COSTS" },
    { category: "Construction - Units", budgeted: 27912600, section: "HARD COSTS" },
    { category: "Construction Loan Interest", budgeted: 2800000, section: "HARD COSTS" },
    { category: "Hard Cost Contingency", budgeted: 1428563, section: "HARD COSTS" },
    { category: "Soft Cost Contingency", budgeted: 148950, section: "HARD COSTS" },
    { category: "Soft Costs (Total)", budgeted: 2979500, section: "SOFT COSTS" }
  ]
};

// Sumner sizing
const sumner = {
  units: 16,
  gross_sf: 35020,
  sellable_sf: 26300
};

// Calculate scaling factors
const unitScaling = sumner.units / beaconBudget.units; // 16/34 = 0.47
const sfScaling = sumner.gross_sf / beaconBudget.gross_sf; // 35020/74424 = 0.47
const avgScaling = (unitScaling + sfScaling) / 2; // Use average

console.log('🔍 SCALING BEACON → SUMNER');
console.log('');
console.log('Beacon Reference:');
console.log('  Units: 34 | Gross SF: 74,424 | Sellable SF: 55,818');
console.log('');
console.log('Sumner Target:');
console.log('  Units: 16 | Gross SF: 35,020 | Sellable SF: 26,300');
console.log('');
console.log('Scaling Factors:');
console.log('  Unit scaling: ' + (unitScaling * 100).toFixed(1) + '%');
console.log('  SF scaling: ' + (sfScaling * 100).toFixed(1) + '%');
console.log('  Average scaling: ' + (avgScaling * 100).toFixed(1) + '%');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('SCALED BUDGET FOR SUMNER STREET 191');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Scale each line item
const scaledItems = beaconBudget.budget_items.map(item => {
  const scaledAmount = Math.round(item.budgeted * avgScaling);
  return {
    category: item.category,
    beacon_budgeted: item.budgeted,
    scaled_budgeted: scaledAmount,
    scaling_factor: avgScaling,
    section: item.section
  };
});

let hardCostTotal = 0;
let softCostTotal = 0;

scaledItems.forEach((item, i) => {
  const beaconStr = '$' + (item.beacon_budgeted / 1000000).toFixed(2) + 'M';
  const scaledStr = '$' + (item.scaled_budgeted / 1000000).toFixed(2) + 'M';
  
  console.log(`${i + 1}. ${item.category}`);
  console.log(`   Beacon:  ${beaconStr.padEnd(12)} → Scaled: ${scaledStr}`);
  
  if (item.section === 'HARD COSTS') {
    hardCostTotal += item.scaled_budgeted;
  } else {
    softCostTotal += item.scaled_budgeted;
  }
  console.log('');
});

const totalDevelopment = hardCostTotal + softCostTotal;

console.log('═══════════════════════════════════════════════════════════');
console.log('SUMMARY - SCALED TO SUMNER');
console.log('═══════════════════════════════════════════════════════════');
console.log('Hard Costs:        $' + (hardCostTotal / 1000000).toFixed(2) + 'M');
console.log('Soft Costs:        $' + (softCostTotal / 1000000).toFixed(2) + 'M');
console.log('─────────────────────────────────────');
console.log('TOTAL DEVELOPMENT: $' + (totalDevelopment / 1000000).toFixed(2) + 'M');
console.log('');
console.log('Per Unit (16 units):  $' + (totalDevelopment / 16 / 1000).toFixed(0) + 'K/unit');
console.log('Per SF Gross:         $' + (totalDevelopment / sumner.gross_sf).toFixed(0) + '/SF');
console.log('Per SF Sellable:      $' + (totalDevelopment / sumner.sellable_sf).toFixed(0) + '/SF');

// Create import object
const scaledBudgetImport = {
  project: "191 Sumner Street (Beacon Scaled)",
  units: sumner.units,
  gross_sf: sumner.gross_sf,
  sellable_sf: sumner.sellable_sf,
  description: "16-unit residential development scaled from Beacon template",
  budget_items: scaledItems.map(item => ({
    category: item.category,
    budgeted: item.scaled_budgeted,
    actual: item.scaled_budgeted,
    notes: `Scaled from Beacon: $${(item.beacon_budgeted / 1000000).toFixed(2)}M × ${(avgScaling * 100).toFixed(1)}%`,
    section: item.section
  })),
  totals: {
    hard_costs: hardCostTotal,
    soft_costs: softCostTotal,
    total_development: totalDevelopment
  },
  scaling_reference: {
    beacon_units: beaconBudget.units,
    beacon_gross_sf: beaconBudget.gross_sf,
    sumner_units: sumner.units,
    sumner_gross_sf: sumner.gross_sf,
    scaling_factor: avgScaling
  }
};

// Save the scaled budget
const exportPath = path.join(__dirname, '../data/alpine/sumner-beacon-scaled.json');
fs.writeFileSync(exportPath, JSON.stringify(scaledBudgetImport, null, 2));

console.log('');
console.log('✅ Scaled budget saved to: data/alpine/sumner-beacon-scaled.json');
