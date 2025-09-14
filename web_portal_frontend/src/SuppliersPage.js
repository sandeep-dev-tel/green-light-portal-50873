import React, { useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * SuppliersPage renders the Admin > Suppliers listing page with:
 * - Summary metric cards
 * - Search and grade filter
 * - Sortable, scrollable table with specified columns
 */
export default function SuppliersPage() {
  // theme vars and utility CSS classes are scoped here to avoid impacting global theme
  // Local state
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [sort, setSort] = useState({ key: 'supplier', dir: 'asc' });

  // Seed data (from design notes - representative examples)
  const data = useMemo(
    () => [
      { supplier: 'Agrisoft', country: 'Brazil', industry: 'AgriTech', renewables: 45, sbti: 'None', products: 3, grade: 'B', lastUpdated: '2023-09-02' },
      { supplier: 'BareTech', country: 'India', industry: 'Battery', renewables: 52, sbti: 'Committed', products: 5, grade: 'A', lastUpdated: '2024-01-12' },
      { supplier: 'BrightSolar', country: 'USA', industry: 'Renewables', renewables: 70, sbti: 'Approved', products: 2, grade: 'A', lastUpdated: '2024-05-19' },
      { supplier: 'EcoFusion', country: 'Germany', industry: 'Automotive', renewables: 30, sbti: 'Committed', products: 1, grade: 'B', lastUpdated: '2023-11-30' },
      { supplier: 'PackRight', country: 'Netherlands', industry: 'Packaging', renewables: 67, sbti: 'Approved', products: 4, grade: 'A', lastUpdated: '2024-02-18' },
      { supplier: 'MediCore', country: 'Japan', industry: 'Healthcare', renewables: 15, sbti: 'None', products: 3, grade: 'C', lastUpdated: '2023-08-09' },
      { supplier: 'RoboAxis', country: 'China', industry: 'Robotics', renewables: 10, sbti: 'None', products: 6, grade: 'C', lastUpdated: '2023-07-21' },
      { supplier: 'EcoPrint', country: 'France', industry: 'Packaging', renewables: 30, sbti: 'Committed', products: 2, grade: 'B', lastUpdated: '2023-12-05' },
    ],
    []
  );

  const columns = [
    { key: 'supplier', label: 'Supplier', sortable: true, width: '18%' },
    { key: 'country', label: 'Country', sortable: true, width: '12%' },
    { key: 'industry', label: 'Industry', sortable: true, width: '14%' },
    { key: 'renewables', label: 'Renewables %', sortable: true, align: 'right', width: '10%' },
    { key: 'sbti', label: 'SBTi', sortable: true, width: '10%' },
    { key: 'products', label: 'Products', sortable: true, align: 'right', width: '8%' },
    { key: 'grade', label: 'Grade', sortable: true, width: '8%' },
    { key: 'lastUpdated', label: 'Last Updated', sortable: true, width: '12%' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data.filter((r) => {
      const hay = `${r.supplier} ${r.country} ${r.industry}`.toLowerCase();
      const matchesText = q.length === 0 || hay.includes(q);
      const matchesGrade =
        gradeFilter === 'All grades' ? true : r.grade === gradeFilter.replace('Grade ', '');
      return matchesText && matchesGrade;
    });

    // sort
    const { key, dir } = sort;
    rows.sort((a, b) => {
      let av = a[key];
      let bv = b[key];
      // normalize numbers
      if (key === 'renewables' || key === 'products') {
        av = Number(av);
        bv = Number(bv);
      }
      // dates
      if (key === 'lastUpdated') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [data, query, gradeFilter, sort]);

  const metrics = useMemo(() => {
    const onboarded = data.length;
    const a = data.filter((d) => d.grade === 'A').length;
    const b = data.filter((d) => d.grade === 'B').length;
    const c = data.filter((d) => d.grade === 'C').length;
    return { onboarded, a, b, c };
  }, [data]);

  const setSortKey = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  return (
    <div className="suppliers-page">
      <SuppliersStyles />

      {/* Summary Metrics Row */}
      <section className="sp-cards" aria-label="Summary metrics">
        <MetricCard title="Suppliers onboarded" value={metrics.onboarded} accent="var(--accent-blue)" />
        <MetricCard title="Grade A" value={metrics.a} accent="var(--accent-green)" />
        <MetricCard title="Grade B" value={metrics.b} accent="var(--accent-amber)" />
        <MetricCard title="Grade C" value={metrics.c} accent="var(--accent-red)" />
      </section>

      {/* Search and Filter */}
      <section className="sp-filter panel-like" aria-label="Search and filters">
        <div className="sp-search-row">
          <span className="sp-search-icon" aria-hidden="true">🔎</span>
          <input
            className="sp-input"
            placeholder="Search suppliers, country, industry…"
            aria-label="Search suppliers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sp-filter-row">
          <label className="sp-label" htmlFor="gradeFilter">Grade</label>
          <select
            id="gradeFilter"
            className="sp-select"
            aria-label="Filter by grade"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option>All grades</option>
            <option>Grade A</option>
            <option>Grade B</option>
            <option>Grade C</option>
          </select>
        </div>
      </section>

      {/* Data Table */}
      <section className="sp-table-wrap panel-like" aria-label="Suppliers table">
        <div className="sp-table-scroll">
          <table className="sp-table">
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSorted = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.align || 'left' }}
                    >
                      <button
                        type="button"
                        className={`sp-th-btn ${col.sortable ? '' : 'disabled'}`}
                        onClick={() => col.sortable && setSortKey(col.key)}
                        aria-label={col.sortable ? `Sort by ${col.label}` : col.label}
                      >
                        <span>{col.label}</span>
                        {col.sortable && (
                          <span className={`sp-sort ${isSorted ? 'active' : ''}`}>
                            {isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.supplier}-${row.country}`}>
                  <td>{row.supplier}</td>
                  <td>{row.country}</td>
                  <td>{row.industry}</td>
                  <td style={{ textAlign: 'right' }}>{row.renewables}%</td>
                  <td>{row.sbti}</td>
                  <td style={{ textAlign: 'right' }}>{row.products}</td>
                  <td>
                    <GradePill grade={row.grade} />
                  </td>
                  <td>{row.lastUpdated}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length} style={{ color: 'var(--text-secondary)' }}>
                    No suppliers match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Simple pagination placeholder for long lists */}
        <div className="sp-pagination" aria-label="Pagination">
          <button className="sp-btn ghost" disabled>Prev</button>
          <div className="sp-page">Page 1 of 1</div>
          <button className="sp-btn ghost" disabled>Next</button>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, accent }) {
  return (
    <div className="sp-card">
      <div className="sp-card-dot" style={{ background: accent }} />
      <div className="sp-card-title">{title}</div>
      <div className="sp-card-value">{value}</div>
    </div>
  );
}

function GradePill({ grade }) {
  const map = {
    A: { bg: 'var(--pill-A-bg)', color: 'var(--pill-A-text)' },
    B: { bg: 'var(--pill-B-bg)', color: 'var(--pill-B-text)' },
    C: { bg: 'var(--pill-C-bg)', color: 'var(--pill-C-text)' },
  };
  const { bg, color } = map[grade] || map.C;
  return (
    <span className="sp-pill" style={{ background: bg, color }}>
      {grade}
    </span>
  );
}

/**
 * Local styles for Suppliers page.
 * Uses CSS variables described in design notes and aligns with existing dashboard scale (0.8x).
 */
function SuppliersStyles() {
  return (
    <style>{`
    .suppliers-page {
      --bg-canvas: #F7F7F9;
      --bg-surface: #FFFFFF;
      --text-primary: #1F2937;
      --text-secondary: #6B7280;
      --border-subtle: #E5E7EB;
      --accent-green: #22C55E;
      --accent-amber: #F59E0B;
      --accent-red: #EF4444;
      --accent-blue: #3B82F6;
      --pill-A-bg: #ECFDF5; --pill-A-text: #065F46;
      --pill-B-bg: #FFFBEB; --pill-B-text: #92400E;
      --pill-C-bg: #FEF2F2; --pill-C-text: #991B1B;

      display: grid;
      gap: 16px;
      font-size: calc(1rem * var(--font-scale, 0.8));
    }

    .panel-like {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      box-shadow: 0 10px 20px rgba(59, 131, 91, 0.06);
      padding: 16px;
    }

    /* Metrics grid */
    .sp-cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .sp-card {
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 20px rgba(59, 131, 91, 0.06);
    }
    .sp-card-dot {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 10px;
      height: 10px;
      border-radius: 999px;
    }
    .sp-card-title {
      color: var(--text-secondary);
      font-weight: 600;
      margin-bottom: 6px;
    }
    .sp-card-value {
      color: var(--text-primary);
      font-weight: 800;
      font-size: 1.4em;
    }

    /* Filters */
    .sp-filter {
      display: grid;
      gap: 12px;
    }
    .sp-search-row {
      display: grid;
      grid-template-columns: 28px 1fr;
      align-items: center;
      background: #fff;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 8px 10px;
    }
    .sp-search-icon {
      color: var(--text-secondary);
      text-align: center;
    }
    .sp-input {
      border: none;
      outline: none;
      font-size: 1em;
      color: var(--text-primary);
    }
    .sp-filter-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .sp-label {
      color: var(--text-secondary);
      font-size: 0.95em;
    }
    .sp-select {
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      padding: 8px 10px;
      outline: none;
    }
    .sp-select:focus, .sp-input:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
    }

    /* Table */
    .sp-table-wrap { padding: 0; }
    .sp-table-scroll {
      overflow: auto;
      border-radius: 12px 12px 0 0;
    }
    .sp-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: var(--bg-surface);
    }
    thead th {
      position: sticky;
      top: 0;
      background: var(--bg-surface);
      z-index: 1;
      border-bottom: 1px solid var(--border-subtle);
    }
    th, td {
      padding: 12px 16px;
      font-size: 0.95em;
      color: var(--text-primary);
      white-space: nowrap;
    }
    tbody tr:nth-child(odd) td {
      background: #FAFAFB;
    }
    .sp-th-btn {
      background: transparent;
      border: none;
      font-weight: 700;
      color: var(--text-primary);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .sp-th-btn.disabled { cursor: default; opacity: 0.8; }
    .sp-sort { color: var(--text-secondary); font-size: 0.9em; }
    .sp-sort.active { color: var(--accent-blue); }

    .sp-pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-weight: 700;
      min-width: 28px;
      text-align: center;
      font-size: 0.9em;
    }

    .sp-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 12px;
      border-top: 1px solid var(--border-subtle);
      border-radius: 0 0 12px 12px;
    }
    .sp-btn.ghost {
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 8px 12px;
      color: var(--text-secondary);
    }
    .sp-page { color: var(--text-secondary); }

    /* Responsive */
    @media (max-width: 1200px) {
      .sp-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 768px) {
      .sp-cards { grid-template-columns: 1fr; }
    }
    `}</style>
  );
}
