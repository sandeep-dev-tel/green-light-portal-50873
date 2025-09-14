//
// src/data/mockSuppliers.js
// Centralized mock supplier data source for the web portal.
// Exposes deterministic generator and an exported combined data array
// so all screens use this single source of truth.
//
// Schema of each supplier record:
// {
//   supplier: string,
//   country: string,
//   industry: string,
//   renewables: number, // 0..100
//   sbti: 'None' | 'Committed' | 'Approved',
//   products: number,
//   grade: 'A' | 'B' | 'C' | 'D',
//   lastUpdated: 'YYYY-MM-DD'
// }

// PUBLIC_INTERFACE
export const mockSuppliersSeed = [
  /** This is a public variable containing hand-authored seed examples. */
  { supplier: 'Agrisoft', country: 'Brazil', industry: 'AgriTech', renewables: 45, sbti: 'None', products: 3, grade: 'B', lastUpdated: '2023-09-02' },
  { supplier: 'BareTech', country: 'India', industry: 'Battery', renewables: 52, sbti: 'Committed', products: 5, grade: 'A', lastUpdated: '2024-01-12' },
  { supplier: 'BrightSolar', country: 'USA', industry: 'Renewables', renewables: 70, sbti: 'Approved', products: 2, grade: 'A', lastUpdated: '2024-05-19' },
  { supplier: 'EcoFusion', country: 'Germany', industry: 'Automotive', renewables: 30, sbti: 'Committed', products: 1, grade: 'B', lastUpdated: '2023-11-30' },
  { supplier: 'PackRight', country: 'Netherlands', industry: 'Packaging', renewables: 67, sbti: 'Approved', products: 4, grade: 'A', lastUpdated: '2024-02-18' },
  { supplier: 'MediCore', country: 'Japan', industry: 'Healthcare', renewables: 15, sbti: 'None', products: 3, grade: 'C', lastUpdated: '2023-08-09' },
  { supplier: 'RoboAxis', country: 'China', industry: 'Robotics', renewables: 10, sbti: 'None', products: 6, grade: 'C', lastUpdated: '2023-07-21' },
  { supplier: 'EcoPrint', country: 'France', industry: 'Packaging', renewables: 30, sbti: 'Committed', products: 2, grade: 'B', lastUpdated: '2023-12-05' },
];

// PUBLIC_INTERFACE
export function generateDeterministicSuppliers(count = 1000) {
  /**
   * This is a public function that generates a deterministic list of suppliers.
   * count: number of generated records (default ~1000).
   * Returns: Array<supplier record>
   */
  const countries = ['USA', 'Germany', 'India', 'Brazil', 'Netherlands', 'Japan', 'China', 'France', 'UK', 'Canada', 'Spain', 'Italy', 'Mexico', 'Sweden', 'Norway'];
  const industries = ['AgriTech', 'Battery', 'Renewables', 'Automotive', 'Packaging', 'Healthcare', 'Robotics', 'Electronics', 'Pharma'];
  const sbtiStates = ['None', 'Committed', 'Approved'];
  const grades = ['A', 'B', 'C', 'D'];
  const baseNames = ['Agrisoft', 'BareTech', 'BrightSolar', 'EcoFusion', 'PackRight', 'MediCore', 'RoboAxis', 'EcoPrint', 'GreenCore', 'SunVolt', 'AquaFlux', 'TerraPack', 'VoltEdge', 'NeuroBot', 'BioHealth'];

  const list = [];
  const TOTAL = Math.max(0, parseInt(count, 10) || 0);
  for (let i = 1; i <= TOTAL; i++) {
    const name = `${baseNames[i % baseNames.length]} ${i.toString().padStart(4, '0')}`;
    const country = countries[i % countries.length];
    const industry = industries[i % industries.length];
    const renewables = 5 + ((i * 11) % 92); // 5..96
    const sbti = sbtiStates[i % sbtiStates.length];
    const products = 1 + (i % 12);
    const grade = grades[i % grades.length]; // includes D
    const month = String((i % 12) + 1).padStart(2, '0');
    const day = String(((i * 3) % 28) + 1).padStart(2, '0');
    const year = 2023 + ((i % 20) > 10 ? 1 : 0); // mostly 2023/2024
    const lastUpdated = `${year}-${month}-${day}`;
    list.push({ supplier: name, country, industry, renewables, sbti, products, grade, lastUpdated });
  }

  // Ensure several explicitly named Grade D examples near the top for easy verification
  const explicitD = [
    { supplier: 'DeltaPack 0001D', country: 'USA', industry: 'Packaging', renewables: 9, sbti: 'None', products: 2, grade: 'D', lastUpdated: '2023-06-12' },
    { supplier: 'LowCarbon Inc 0002D', country: 'India', industry: 'Automotive', renewables: 12, sbti: 'None', products: 1, grade: 'D', lastUpdated: '2024-01-24' },
    { supplier: 'OldData Co 0003D', country: 'Germany', industry: 'Electronics', renewables: 7, sbti: 'Committed', products: 3, grade: 'D', lastUpdated: '2023-03-05' },
    { supplier: 'NonReporting LLC 0004D', country: 'Brazil', industry: 'AgriTech', renewables: 6, sbti: 'None', products: 1, grade: 'D', lastUpdated: '2023-02-14' },
  ];

  return [...explicitD, ...list];
}

// PUBLIC_INTERFACE
export const mockSuppliers = [
  /** This is a public variable exporting the full dataset used by pages. */
  ...mockSuppliersSeed,
  ...generateDeterministicSuppliers(1000),
];
