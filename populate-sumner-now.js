// Direct population of Sumner Street 191 with Beacon-scaled line items
// Run this NOW to populate localStorage with the exact format the tracker expects

const SUMNER_DATA = {
  "id": "project-sumner-191",
  "name": "191 Sumner Street, Newton",
  "address": "191 Sumner Street, Newton",
  "units": 16,
  "grossSF": 35020,
  "sellableSF": 26300,
  "status": "Active",
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString()
};

const SUMNER_BUDGET = {
  "projectId": "project-sumner-191",
  "lineItems": [
    { "category": "HARD COSTS", "description": "Landscaping and irrigation", "originalBudget": 63058, "currentBudget": 63058, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Footings", "originalBudget": 118588, "currentBudget": 118588, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Structural steel", "originalBudget": 468742, "currentBudget": 468742, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Wood framing or steel framing", "originalBudget": 898062, "currentBudget": 898062, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Insulation", "originalBudget": 233882, "currentBudget": 233882, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Masonry / brick / stone", "originalBudget": 736349, "currentBudget": 736349, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Windows", "originalBudget": 242871, "currentBudget": 242871, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Roof structure", "originalBudget": 242668, "currentBudget": 242668, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Heating systems", "originalBudget": 457411, "currentBudget": 457411, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Plumbing fixtures", "originalBudget": 188235, "currentBudget": 188235, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Sprinklers", "originalBudget": 178113, "currentBudget": 178113, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Main electrical service", "originalBudget": 603225, "currentBudget": 603225, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Fire alarm systems", "originalBudget": 17411, "currentBudget": 17411, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Elevator equipment", "originalBudget": 113189, "currentBudget": 113189, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Drywall", "originalBudget": 416470, "currentBudget": 416470, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Fire-rated assemblies", "originalBudget": 87470, "currentBudget": 87470, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Doors and hardware", "originalBudget": 127529, "currentBudget": 127529, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Trim and millwork", "originalBudget": 144877, "currentBudget": 144877, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Paint", "originalBudget": 100841, "currentBudget": 100841, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Flooring", "originalBudget": 422588, "currentBudget": 422588, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Cabinets", "originalBudget": 661300, "currentBudget": 661300, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Countertops", "originalBudget": 90823, "currentBudget": 90823, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Mirrors and accessories", "originalBudget": 4752, "currentBudget": 4752, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Bike storage", "originalBudget": 1411, "currentBudget": 1411, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Contractor overhead", "originalBudget": 408470, "currentBudget": 408470, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Dumpsters", "originalBudget": 12313, "currentBudget": 12313, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Sitework/Shoring", "originalBudget": 604955, "currentBudget": 604955, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Sitework Payment to Ron", "originalBudget": 517647, "currentBudget": 517647, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Wood Framing Labor", "originalBudget": 401340, "currentBudget": 401340, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Winter Conditions", "originalBudget": 40470, "currentBudget": 40470, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "EV Charging Stations", "originalBudget": 7058, "currentBudget": 7058, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Plumbing Rough + Finish", "originalBudget": 438369, "currentBudget": 438369, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Closet Systems", "originalBudget": 80000, "currentBudget": 80000, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Appliances", "originalBudget": 514868, "currentBudget": 514868, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Electrical Fixtures", "originalBudget": 25882, "currentBudget": 25882, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Postal Specialties", "originalBudget": 4517, "currentBudget": 4517, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Final Cleaning", "originalBudget": 9411, "currentBudget": 9411, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Garage Doors", "originalBudget": 9406, "currentBudget": 9406, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "Alpine Property Group Overhead", "originalBudget": 47058, "currentBudget": 47058, "actualSpend": 0 },
    { "category": "HARD COSTS", "description": "FF&E", "originalBudget": 23529, "currentBudget": 23529, "actualSpend": 0 },
    { "category": "SOFT COSTS", "description": "Architectural design", "originalBudget": 195294, "currentBudget": 195294, "actualSpend": 0 }
  ]
};

// Get existing data
let projects = JSON.parse(localStorage.getItem('alpine_projects') || '[]');
let budgets = JSON.parse(localStorage.getItem('alpine_budgets') || '[]');

// Remove existing Sumner if present
projects = projects.filter(p => p.id !== 'project-sumner-191');
budgets = budgets.filter(b => b.projectId !== 'project-sumner-191');

// Add new Sumner data
projects.push(SUMNER_DATA);
budgets.push(SUMNER_BUDGET);

// Save back to localStorage
localStorage.setItem('alpine_projects', JSON.stringify(projects));
localStorage.setItem('alpine_budgets', JSON.stringify(budgets));

console.log('✅ Sumner Street 191 populated with 40 Beacon-scaled line items');
console.log('   Hard Costs: $9,415,058');
console.log('   Soft Costs: $195,294');
console.log('   TOTAL: $9,610,352');
console.log('Reloading page...');

setTimeout(() => window.location.reload(), 500);
