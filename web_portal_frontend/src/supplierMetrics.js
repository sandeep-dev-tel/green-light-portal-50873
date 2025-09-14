//
// supplierMetrics.js
// Utility helpers to compute dashboard metrics from supplier records.
// These functions are pure and reusable by the Dashboard and Suppliers page.

/**
 * PUBLIC_INTERFACE
 * gradeDistribution: Compute counts of A/B/C/D.
 */
export function gradeDistribution(suppliers) {
  /** Returns an object: { A: number, B: number, C: number, D: number } */
  const result = { A: 0, B: 0, C: 0, D: 0 };
  if (!Array.isArray(suppliers)) return result;
  for (const s of suppliers) {
    const g = String(s.grade || '').toUpperCase();
    if (g === 'A' || g === 'B' || g === 'C' || g === 'D') {
      result[g] += 1;
    }
  }
  return result;
}

/**
 * PUBLIC_INTERFACE
 * complianceSplit: Derive compliant vs non-compliant from grades.
 * For demo: A/B are considered compliant; C/D are non-compliant.
 */
export function complianceSplit(suppliers) {
  /** Returns { compliant: number, nonCompliant: number, compliantPct: number } */
  const dist = gradeDistribution(suppliers);
  const compliant = dist.A + dist.B;
  const nonCompliant = dist.C + dist.D;
  const total = compliant + nonCompliant;
  const compliantPct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  return { compliant, nonCompliant, compliantPct };
}

/**
 * PUBLIC_INTERFACE
 * carbonByCategory: Demo computation mapping industries to broad "emission categories".
 * In absence of actual carbon fields, we proxy categories via "industry".
 */
export function carbonByCategory(suppliers) {
  /**
   * We aggregate counts by pseudo categories to populate the pie chart.
   * Mapping (example):
   * - Raw Materials: AgriTech, Packaging
   * - Manufacturing: Automotive, Electronics, Robotics, Healthcare, Pharma
   * - Logistics: (none explicit in dataset) fallback small bin
   * - Packaging: Packaging (already included in Raw Materials, but keep distinct slice)
   * - Other: remaining industries
   */
  const buckets = {
    'Raw Materials': 0,
    Manufacturing: 0,
    Logistics: 0,
    Packaging: 0,
    Other: 0,
  };

  if (!Array.isArray(suppliers)) {
    return [
      { name: 'Raw Materials', value: 0 },
      { name: 'Manufacturing', value: 0 },
      { name: 'Logistics', value: 0 },
      { name: 'Packaging', value: 0 },
      { name: 'Other', value: 0 },
    ];
  }

  const rawSet = new Set(['AgriTech']);
  const manufSet = new Set(['Automotive', 'Electronics', 'Robotics', 'Healthcare', 'Pharma']);
  const packagingSet = new Set(['Packaging']);
  const logisticsSet = new Set(['Logistics']); // rarely used; kept for completeness

  for (const s of suppliers) {
    const industry = s.industry || '';
    if (packagingSet.has(industry)) {
      buckets['Packaging'] += 1;
    } else if (rawSet.has(industry)) {
      buckets['Raw Materials'] += 1;
    } else if (manufSet.has(industry)) {
      buckets['Manufacturing'] += 1;
    } else if (logisticsSet.has(industry)) {
      buckets['Logistics'] += 1;
    } else {
      buckets['Other'] += 1;
    }
  }

  return [
    { name: 'Raw Materials', value: buckets['Raw Materials'] },
    { name: 'Manufacturing', value: buckets['Manufacturing'] },
    { name: 'Logistics', value: buckets['Logistics'] },
    { name: 'Packaging', value: buckets['Packaging'] },
    { name: 'Other', value: buckets['Other'] },
  ];
}

/**
 * PUBLIC_INTERFACE
 * auditProgressSplit: Demo computation of audit stages from lastUpdated recency.
 * - Completed: updated within last 120 days
 * - In Progress: updated within last 240 days
 * - Not Started: updated > 240 days ago or invalid dates but present supplier
 * - Failed: small slice derived from Grade D suppliers (for visualization)
 */
export function auditProgressSplit(suppliers) {
  /** Returns array suitable for pie chart:
   * [{ name: 'Not Started'|'In Progress'|'Completed'|'Failed', value: number }]
   */
  const now = Date.now();
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let failed = 0;

  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return [
      { name: 'Not Started', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Completed', value: 0 },
      { name: 'Failed', value: 0 },
    ];
  }

  for (const s of suppliers) {
    const t = s.lastUpdated ? Date.parse(s.lastUpdated) : NaN;
    if (!Number.isFinite(t)) {
      notStarted += 1;
      continue;
    }
    const days = Math.floor((now - t) / (1000 * 60 * 60 * 24));
    if (days <= 120) completed += 1;
    else if (days <= 240) inProgress += 1;
    else notStarted += 1;
  }

  // Add a small failed slice proportional to Grade D population for the sake of demo visual
  const dist = gradeDistribution(suppliers);
  failed = Math.round(dist.D * 0.1);

  return [
    { name: 'Not Started', value: notStarted },
    { name: 'In Progress', value: inProgress },
    { name: 'Completed', value: completed },
    { name: 'Failed', value: failed },
  ];
}
