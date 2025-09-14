import React, { useMemo, useState } from 'react';
import { mockSuppliers } from './data/mockSuppliers';

/**
 * PUBLIC_INTERFACE
 * SuppliersPage renders the Admin > Suppliers listing page with:
 * - Summary metric cards
 * - Search and grade filter
 * - Sortable, scrollable table with specified columns
 * - Robust pagination (Prev/Next, page count, go-to page), 50 rows per page
 */
export default function SuppliersPage() {
  // Local state
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [sort, setSort] = useState({ key: 'supplier', dir: 'asc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Use centralized mock suppliers dataset
  const data = useMemo(() => mockSuppliers, []);

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

  // Apply filter + sort
  const filteredSorted = useMemo(() => {
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
      if (key === 'renewables' || key === 'products') {
        av = Number(av);
        bv = Number(bv);
      }
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

  // Reset to first page when filters or sorting change
  React.useEffect(() => {
    setPage(1);
  }, [query, gradeFilter, sort]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const startIdx = (pageSafe - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pagedRows = filteredSorted.slice(startIdx, endIdx);

  const metrics = useMemo(() => {
    // Show metrics for the filtered set to make controls feel responsive
    const set = filteredSorted;
    const onboarded = set.length;
    const a = set.filter((d) => d.grade === 'A').length;
    const b = set.filter((d) => d.grade === 'B').length;
    const c = set.filter((d) => d.grade === 'C').length;
    const d = set.filter((x) => x.grade === 'D').length;
    return { onboarded, a, b, c, d };
  }, [filteredSorted]);

  const setSortKey = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const canPrev = pageSafe > 1;
  const canNext = pageSafe < totalPages;

  // Go-to page input controlled locally to avoid jitter while typing
  const [gotoInput, setGotoInput] = useState('');
  const handleGoto = (e) => {
    e.preventDefault();
    const n = parseInt(gotoInput, 10);
    if (!Number.isNaN(n)) {
      const target = Math.min(Math.max(1, n), totalPages);
      setPage(target);
    }
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
        <MetricCard title="Grade D" value={metrics.d} accent="var(--accent-red)" />
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
            <option>Grade D</option>
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
              {pagedRows.map((row) => (
                <tr key={`${row.supplier}-${row.country}-${row.lastUpdated}`}>
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
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} style={{ color: 'var(--text-secondary)' }}>
                    No suppliers match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <div className="sp-pagination" aria-label="Pagination">
          <button
            className="sp-btn ghost"
            onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            Prev
          </button>
          <div className="sp-page" aria-live="polite">
            Page {pageSafe} of {totalPages}
          </div>
          <form onSubmit={handleGoto} style={{ display: 'flex', gap: 8, alignItems: 'center' }} aria-label="Go to page">
            <label className="sp-label" htmlFor="gotoPage">Go to</label>
            <input
              id="gotoPage"
              className="sp-input sp-input-inline"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={`${pageSafe}`}
              value={gotoInput}
              onChange={(e) => setGotoInput(e.target.value)}
              style={{ width: 64, border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 8px' }}
              aria-label="Go to page number"
            />
            <button type="submit" className="sp-btn ghost">Go</button>
          </form>
          <button
            className="sp-btn ghost"
            onClick={() => canNext && setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!canNext}
            aria-label="Next page"
          >
            Next
          </button>
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
    D: { bg: 'var(--pill-C-bg)', color: 'var(--pill-C-text)' }, // reuse C styling for D (red-themed)
  };
  const { bg, color } = map[grade] || map.D;
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
      grid-template-columns: repeat(5, minmax(0, 1fr));
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
      background: var(--bg-surface);
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
    .sp-input-inline {
      background: var(--bg-surface);
      color: var(--text-primary);
    }
    .sp-filter-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
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
      max-height: 480px;
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
      background: color-mix(in oklab, var(--bg-surface) 92%, transparent);
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
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 8px;
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
    .sp-btn.ghost:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sp-page { color: var(--text-secondary); text-align: center; }

    /* Responsive */
    @media (max-width: 1400px) {
      .sp-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 1000px) {
      .sp-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 768px) {
      .sp-cards { grid-template-columns: 1fr; }
      .sp-pagination { grid-template-columns: auto 1fr auto; }
    }
    `}</style>
  );
}
