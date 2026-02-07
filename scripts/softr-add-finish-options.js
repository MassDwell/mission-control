#!/usr/bin/env node
/**
 * Add missing finish options to Softr database via API
 */

const API_KEY = 'whjv2GyLPK61bRclOjw8kaetG';
const DATABASE_ID = '7a809503-2b58-4764-b34a-a3660b474f8e';
const TABLE_ID = 'g8JlnfHDfWmyIe';
const BASE_URL = 'https://tables-api.softr.io/api/v1';

// Field IDs
const FIELDS = {
  name: '94Pst',
  category: 'tOPG4',
  brand: 'CNWpU',
  color: '3Souz',
  isUpgrade: 'ZXpXP',
  upgradePrice: '0qwdC'
};

// Category IDs from Finish Categories table
const CATEGORIES = {
  'Flooring': 'Ehr4iRd23N9c1n',
  'Roof Shingles': 'vu1qTzIkw0HqWd',
  'Siding': 'XckNP2sxjDbxkn',
  'Interior Paint': 'QDkvr8UW7snfeJ',
  'Exterior Lighting': '5S0FGNAynzE8B3',
  'Interior Doors': 'x7xWgEFKlWhP6Z',
  'Cabinets': 'HuISxN3i3B7cic',
  'Countertops': 'hcFx4kVaQfSfno',
  'Bathroom Tile': 'YsaKLrYzOis1I8',
  'Fixtures': 'ZHqxsBBBwQrbQw'
};

// New records to add (not already in DB)
const NEW_RECORDS = [
  // Cabinets (3 new)
  { name: 'Shaker Natural Wood', category: 'Cabinets', brand: 'Shaker Style', color: 'Natural Wood', isUpgrade: false, upgradePrice: 0 },
  { name: 'Modern Flat Panel White', category: 'Cabinets', brand: 'Modern Flat Panel', color: 'White', isUpgrade: true, upgradePrice: 1500 },
  { name: 'Modern Flat Panel Gray', category: 'Cabinets', brand: 'Modern Flat Panel', color: 'Gray', isUpgrade: true, upgradePrice: 1500 },
  
  // Countertops (4 new)
  { name: 'Quartz Gray', category: 'Countertops', brand: 'Quartz', color: 'Gray', isUpgrade: false, upgradePrice: 0 },
  { name: 'Quartz Black', category: 'Countertops', brand: 'Quartz', color: 'Black', isUpgrade: false, upgradePrice: 0 },
  { name: 'Granite Black Galaxy', category: 'Countertops', brand: 'Granite', color: 'Black Galaxy', isUpgrade: true, upgradePrice: 2000 },
  { name: 'Butcher Block Natural', category: 'Countertops', brand: 'Butcher Block', color: 'Natural', isUpgrade: true, upgradePrice: 800 },
  
  // Interior Paint (2 new)
  { name: 'Agreeable Gray', category: 'Interior Paint', brand: 'Sherwin Williams', color: 'Agreeable Gray', isUpgrade: false, upgradePrice: 0 },
  { name: 'Accessible Beige', category: 'Interior Paint', brand: 'Sherwin Williams', color: 'Accessible Beige', isUpgrade: false, upgradePrice: 0 },
  
  // Bathroom Tile (3 new)
  { name: 'White Subway', category: 'Bathroom Tile', brand: 'Ceramic', color: 'White Subway', isUpgrade: false, upgradePrice: 0 },
  { name: 'Gray Subway', category: 'Bathroom Tile', brand: 'Ceramic', color: 'Gray Subway', isUpgrade: false, upgradePrice: 0 },
  { name: 'White Hexagon', category: 'Bathroom Tile', brand: 'Porcelain', color: 'White Hexagon', isUpgrade: true, upgradePrice: 500 },
  
  // Fixtures (3 new)
  { name: 'Brushed Nickel', category: 'Fixtures', brand: 'Delta', color: 'Brushed Nickel', isUpgrade: false, upgradePrice: 0 },
  { name: 'Matte Black', category: 'Fixtures', brand: 'Delta', color: 'Matte Black', isUpgrade: true, upgradePrice: 200 },
  { name: 'Chrome', category: 'Fixtures', brand: 'Delta', color: 'Chrome', isUpgrade: false, upgradePrice: 0 },
  
  // Interior Doors (3 new)
  { name: '6-Panel White', category: 'Interior Doors', brand: 'Masonite', color: '6-Panel White', isUpgrade: false, upgradePrice: 0 },
  { name: 'Shaker White Door', category: 'Interior Doors', brand: 'Masonite', color: 'Shaker White', isUpgrade: true, upgradePrice: 150 },
  { name: 'Flush White', category: 'Interior Doors', brand: 'Masonite', color: 'Flush White', isUpgrade: false, upgradePrice: 0 },
  
  // Exterior Lighting (3 new)
  { name: 'Coach Light Black', category: 'Exterior Lighting', brand: 'Kichler', color: 'Black', isUpgrade: false, upgradePrice: 0 },
  { name: 'Coach Light Bronze', category: 'Exterior Lighting', brand: 'Kichler', color: 'Bronze', isUpgrade: false, upgradePrice: 0 },
  { name: 'Modern Black', category: 'Exterior Lighting', brand: 'Kichler', color: 'Matte Black', isUpgrade: true, upgradePrice: 100 }
];

async function createRecord(record) {
  const categoryId = CATEGORIES[record.category];
  if (!categoryId) {
    console.error(`Unknown category: ${record.category}`);
    return null;
  }

  const payload = {
    fields: {
      [FIELDS.name]: record.name,
      [FIELDS.category]: categoryId,
      [FIELDS.brand]: record.brand,
      [FIELDS.color]: record.color,
      [FIELDS.isUpgrade]: record.isUpgrade,
      [FIELDS.upgradePrice]: record.upgradePrice
    }
  };

  try {
    const response = await fetch(
      `${BASE_URL}/databases/${DATABASE_ID}/tables/${TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Softr-Api-Key': API_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create ${record.name}: ${error}`);
      return null;
    }

    const result = await response.json();
    console.log(`✅ Created: ${record.name}`);
    return result;
  } catch (err) {
    console.error(`Error creating ${record.name}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`Adding ${NEW_RECORDS.length} finish options to Softr...`);
  console.log('');

  let success = 0;
  let failed = 0;

  for (const record of NEW_RECORDS) {
    const result = await createRecord(record);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('');
  console.log(`Done! Created ${success}/${NEW_RECORDS.length} records.`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
  }
}

main();
