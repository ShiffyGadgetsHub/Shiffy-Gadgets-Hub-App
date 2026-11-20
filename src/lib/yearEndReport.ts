import type ExcelJSType from 'exceljs';
import type { InventoryItem, Transaction } from '../types';
import { computeYearStats } from './yearStats';

// exceljs's bundled types don't expose `color` on the data bar rule even
// though the library reads and renders it correctly (verified against the
// written file's XML) — widen just enough to pass it through.
function dataBarRule(argb: string, priority: number): ExcelJSType.ConditionalFormattingRule {
  return {
    type: 'dataBar',
    cfvo: [{ type: 'min' }, { type: 'max' }],
    gradient: true,
    priority,
    color: { argb },
  } as unknown as ExcelJSType.ConditionalFormattingRule;
}

const COLORS = {
  brand: '0A6CFF',
  accent: 'EC3FDC',
  green: '1E9E6B',
  greenLight: 'E6F6EF',
  amber: 'D99A2B',
  amberLight: 'FCF0DC',
  rose: 'C63D3D',
  roseLight: 'FBE9E9',
  violet: '7B61FF',
  headerBg: '0B3B2E',
  headerBg2: '115C47',
  white: 'FFFFFF',
  cardBg: 'FFFFFF',
  cardBorder: 'E2E5EA',
  grayText: '5B6072',
  darkText: '171A2B',
  tableHeaderBg: 'EAF3FF',
};
const argb = (hex: string) => `FF${hex}`;

const CATEGORY_PALETTE = [COLORS.brand, COLORS.accent, COLORS.green, COLORS.amber, COLORS.violet, COLORS.rose, '888888'];

function money(n: number) {
  return Math.round(n);
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function trendText(pct: number | null): string {
  if (pct === null) return '';
  const arrow = pct >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(pct).toFixed(1)}% vs last year`;
}

export async function downloadYearEndReport(
  year: number,
  items: InventoryItem[],
  transactions: Transaction[],
  storeName: string,
  currencySymbol: string
) {
  const ExcelJS = (await import('exceljs')).default;
  const { renderLineChart, renderDoughnutChart, renderHorizontalBarChart, renderComboChart } = await import('./chartImages');
  const stats = computeYearStats(items, transactions, year);
  const prevStats = computeYearStats(items, transactions, year - 1);
  const takenInYear = transactions
    .filter((t) => new Date(t.takenDate).getFullYear() === year)
    .sort((a, b) => a.takenDate.localeCompare(b.takenDate));
  const completedInYear = takenInYear
    .filter((t) => t.status === 'completed' && t.completedDate)
    .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = storeName;
  workbook.created = new Date();

  // ───────────────────────────────────────────────────────────────────
  // Charts (rendered as images — ExcelJS can't create native Excel
  // chart objects, so a crisp rendered PNG is the closest equivalent)
  // ───────────────────────────────────────────────────────────────────
  const [lineImg, donutImg, barImg, comboImg] = await Promise.all([
    renderLineChart(
      stats.monthly.map((m) => m.label),
      stats.monthly.map((m) => m.revenue),
      argb(COLORS.brand),
      380,
      230
    ),
    stats.byCategory.length
      ? renderDoughnutChart(
          stats.byCategory.map((c) => c.label),
          stats.byCategory.map((c) => c.revenue),
          stats.byCategory.map((_, i) => argb(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length])),
          380,
          250
        )
      : null,
    stats.topItems.length
      ? renderHorizontalBarChart(
          stats.topItems.slice(0, 5).map((i) => i.label),
          stats.topItems.slice(0, 5).map((i) => i.revenue),
          argb(COLORS.green),
          380,
          230
        )
      : null,
    renderComboChart(
      stats.monthly.map((m) => m.label),
      stats.monthly.map((m) => m.revenue),
      stats.monthly.map((m) => m.units),
      argb(COLORS.brand),
      argb(COLORS.accent),
      420,
      240
    ),
  ]);

  // ───────────────────────────────────────────────────────────────────
  // Sheet 1 — Dashboard
  // ───────────────────────────────────────────────────────────────────
  const dash = workbook.addWorksheet('Dashboard', { views: [{ showGridLines: false }] });
  dash.columns = Array.from({ length: 12 }).map(() => ({ width: 12 }));

  let row = 1;
  const ROW_PX = 20;
  const rowsFor = (px: number) => Math.ceil(px / ROW_PX);

  function addImageAt(base64: string, col: number, startRow: number, width: number, height: number) {
    const imageId = workbook.addImage({ base64, extension: 'png' });
    dash.addImage(imageId, { tl: { col, row: startRow - 1 }, ext: { width, height } });
  }

  // ---- Header banner ----
  dash.mergeCells(row, 1, row + 1, 8);
  const title = dash.getCell(row, 1);
  title.value = `${storeName}  ·  Year-End Wrap`;
  title.font = { bold: true, size: 20, color: { argb: argb(COLORS.white) } };
  title.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

  dash.mergeCells(row, 9, row + 1, 12);
  const dateBadge = dash.getCell(row, 9);
  dateBadge.value = `1 Jan ${year} – 31 Dec ${year}`;
  dateBadge.font = { bold: true, size: 11, color: { argb: argb(COLORS.headerBg) } };
  dateBadge.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.white) } };
  dateBadge.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let r = row; r <= row + 1; r++) {
    for (let c = 1; c <= 12; c++) {
      if (c >= 9) continue; // date badge cell already styled
      const cell = dash.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.headerBg) } };
    }
  }
  dash.getRow(row).height = 26;
  dash.getRow(row + 1).height = 20;
  const subtitle = dash.getCell(row + 1, 1);
  subtitle.value = 'Track · Analyze · Grow';
  subtitle.font = { size: 11, color: { argb: argb('CFE8DD') } };
  subtitle.alignment = { vertical: 'top', horizontal: 'left', indent: 1 };
  row += 3;

  // ---- KPI cards ----
  interface Kpi {
    label: string;
    value: string;
    trend: string;
    accent: string;
  }
  const kpis: Kpi[] = [
    {
      label: 'Total Revenue',
      value: `${currencySymbol}${money(stats.revenue).toLocaleString()}`,
      trend: trendText(pctChange(stats.revenue, prevStats.revenue)),
      accent: COLORS.green,
    },
    {
      label: 'Units Sold',
      value: String(stats.unitsSold),
      trend: trendText(pctChange(stats.unitsSold, prevStats.unitsSold)),
      accent: COLORS.brand,
    },
    {
      label: 'Total Profit',
      value: `${currencySymbol}${money(stats.profit).toLocaleString()}`,
      trend: trendText(pctChange(stats.profit, prevStats.profit)),
      accent: COLORS.violet,
    },
    {
      label: 'Avg. Sale Value',
      value: `${currencySymbol}${money(stats.avgSaleValue).toLocaleString()}`,
      trend: trendText(pctChange(stats.avgSaleValue, prevStats.avgSaleValue)),
      accent: COLORS.amber,
    },
  ];

  const kpiCardRow = row;
  const kpiColSpan = 3;
  kpis.forEach((kpi, i) => {
    const startCol = i * kpiColSpan + 1;
    const endCol = startCol + kpiColSpan - 1;

    // Top accent strip
    dash.mergeCells(kpiCardRow, startCol, kpiCardRow, endCol);
    const accentCell = dash.getCell(kpiCardRow, startCol);
    accentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(kpi.accent) } };
    dash.getRow(kpiCardRow).height = 4;

    // Label
    dash.mergeCells(kpiCardRow + 1, startCol, kpiCardRow + 1, endCol);
    const labelCell = dash.getCell(kpiCardRow + 1, startCol);
    labelCell.value = kpi.label;
    labelCell.font = { size: 10, color: { argb: argb(COLORS.grayText) } };
    labelCell.alignment = { indent: 1, vertical: 'bottom' };

    // Value
    dash.mergeCells(kpiCardRow + 2, startCol, kpiCardRow + 2, endCol);
    const valueCell = dash.getCell(kpiCardRow + 2, startCol);
    valueCell.value = kpi.value;
    valueCell.font = { bold: true, size: 16, color: { argb: argb(COLORS.darkText) } };
    valueCell.alignment = { indent: 1, vertical: 'middle' };
    dash.getRow(kpiCardRow + 2).height = 24;

    // Trend
    dash.mergeCells(kpiCardRow + 3, startCol, kpiCardRow + 3, endCol);
    const trendCell = dash.getCell(kpiCardRow + 3, startCol);
    trendCell.value = kpi.trend || ' ';
    trendCell.font = {
      size: 9,
      bold: true,
      color: { argb: argb(kpi.trend.startsWith('▲') ? COLORS.green : kpi.trend.startsWith('▼') ? COLORS.rose : COLORS.grayText) },
    };
    trendCell.alignment = { indent: 1 };

    // Card border
    for (let r = kpiCardRow; r <= kpiCardRow + 4; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = dash.getCell(r, c);
        cell.border = {
          top: r === kpiCardRow ? undefined : { style: 'thin', color: { argb: argb(COLORS.cardBorder) } },
          bottom: { style: 'thin', color: { argb: argb(COLORS.cardBorder) } },
          left: c === startCol ? { style: 'thin', color: { argb: argb(COLORS.cardBorder) } } : undefined,
          right: c === endCol ? { style: 'thin', color: { argb: argb(COLORS.cardBorder) } } : undefined,
        };
        if (r > kpiCardRow) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.cardBg) } };
      }
    }
    dash.getRow(kpiCardRow + 4).height = 6;
  });
  row = kpiCardRow + 6;

  function sectionHeader(label: string) {
    dash.mergeCells(row, 1, row, 12);
    const cell = dash.getCell(row, 1);
    cell.value = label;
    cell.font = { bold: true, size: 12, color: { argb: argb(COLORS.darkText) } };
    dash.getRow(row).height = 20;
    row++;
  }

  // ---- Charts row: trend / category / top products ----
  sectionHeader('Sales Trend, Category Mix & Top Products');
  const chartsRow = row;
  addImageAt(lineImg, 0, chartsRow, 380, 230);
  if (donutImg) addImageAt(donutImg, 4, chartsRow, 380, 250);
  if (barImg) addImageAt(barImg, 8, chartsRow, 380, 230);
  row = chartsRow + rowsFor(250) + 1;

  // ---- Recent sales table ----
  sectionHeader('Recent Sales');
  const recentHeaders = ['Date', 'Customer', 'Product', 'Category', `Amount (${currencySymbol})`, 'Status'];
  recentHeaders.forEach((h, i) => {
    const cell = dash.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.tableHeaderBg) } };
  });
  row++;
  const recentSales = completedInYear.slice(0, 12);
  for (const t of recentSales) {
    const statusColor =
      t.paymentStatus === 'paid' ? COLORS.greenLight : t.paymentStatus === 'partial' ? COLORS.amberLight : COLORS.roseLight;
    const statusTextColor = t.paymentStatus === 'paid' ? COLORS.green : t.paymentStatus === 'partial' ? COLORS.amber : COLORS.rose;
    dash.getCell(row, 1).value = new Date(t.completedDate!).toLocaleDateString();
    dash.getCell(row, 2).value = t.customerName;
    dash.getCell(row, 3).value = t.itemName;
    dash.getCell(row, 4).value = t.itemCategory;
    dash.getCell(row, 5).value = money(t.totalAmount);
    dash.getCell(row, 5).numFmt = '#,##0';
    const statusCell = dash.getCell(row, 6);
    statusCell.value = t.paymentStatus === 'paid' ? 'Paid' : t.paymentStatus === 'partial' ? 'Partial' : 'Unpaid';
    statusCell.font = { bold: true, color: { argb: argb(statusTextColor) } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(statusColor) } };
    statusCell.alignment = { horizontal: 'center' };
    row++;
  }
  if (recentSales.length === 0) {
    dash.getCell(row, 1).value = 'No completed sales this year.';
    row++;
  }
  row++;

  // ---- Monthly sales vs units + insights, side by side ----
  sectionHeader('Monthly Sales vs Units, & Quick Insights');
  const bottomRow = row;
  addImageAt(comboImg, 0, bottomRow, 420, 240);

  const insights: string[] = [];
  if (stats.bestMonth)
    insights.push(`${stats.bestMonth.label} was your strongest month, bringing in ${currencySymbol}${money(stats.bestMonth.revenue).toLocaleString()}.`);
  if (stats.byCategory.length > 0) {
    const top = stats.byCategory[0];
    const pct = stats.revenue > 0 ? ((top.revenue / stats.revenue) * 100).toFixed(0) : '0';
    insights.push(`${top.label} was your best-performing category, generating ${pct}% of total revenue.`);
  }
  if (stats.staffLeaderboard.length > 0) {
    const top = stats.staffLeaderboard[0];
    insights.push(`${top.name} led the team with ${currencySymbol}${money(top.revenue).toLocaleString()} in sales (${top.units} units).`);
  }
  if (stats.outstandingFromYear > 0) {
    insights.push(`${currencySymbol}${money(stats.outstandingFromYear).toLocaleString()} is still outstanding from sales started this year — worth following up on.`);
  }
  if (stats.returnedCount > 0) {
    insights.push(`${stats.returnedCount} item(s) worth ${currencySymbol}${money(stats.returnedValue).toLocaleString()} were returned this year.`);
  }
  if (insights.length === 0) insights.push('No sales activity recorded for this year yet.');

  let insightRow = bottomRow;
  dash.mergeCells(insightRow, 7, insightRow, 12);
  const insightTitle = dash.getCell(insightRow, 7);
  insightTitle.value = 'Quick Insights';
  insightTitle.font = { bold: true, size: 11 };
  insightRow++;
  for (const line of insights) {
    dash.mergeCells(insightRow, 7, insightRow + 1, 12);
    const cell = dash.getCell(insightRow, 7);
    cell.value = `●  ${line}`;
    cell.font = { size: 10, color: { argb: argb(COLORS.darkText) } };
    cell.alignment = { wrapText: true, vertical: 'top' };
    insightRow += 2;
  }
  row = Math.max(bottomRow + rowsFor(240), insightRow) + 2;

  // ---- Supplementary detail tables ----
  function tableHeader(cols: string[]) {
    cols.forEach((c, i) => {
      const cell = dash.getCell(row, i + 1);
      cell.value = c;
      cell.font = { bold: true, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.tableHeaderBg) } };
    });
    row++;
  }

  sectionHeader('Top 10 Customers');
  tableHeader(['Customer', 'Phone', `Total Spend (${currencySymbol})`, 'Purchases']);
  for (const c of stats.topCustomers) {
    dash.getCell(row, 1).value = c.name;
    dash.getCell(row, 2).value = c.phone ?? '';
    dash.getCell(row, 3).value = money(c.revenue);
    dash.getCell(row, 3).numFmt = '#,##0';
    dash.getCell(row, 4).value = c.units;
    row++;
  }
  if (stats.topCustomers.length === 0) {
    dash.getCell(row, 1).value = 'No sales this year.';
    row++;
  }
  row++;

  sectionHeader('Staff Performance');
  tableHeader(['Staff', `Revenue (${currencySymbol})`, 'Units Sold']);
  const staffStartRow = row;
  for (const s of stats.staffLeaderboard) {
    dash.getCell(row, 1).value = s.name;
    dash.getCell(row, 2).value = money(s.revenue);
    dash.getCell(row, 2).numFmt = '#,##0';
    dash.getCell(row, 3).value = s.units;
    row++;
  }
  if (stats.staffLeaderboard.length > 0) {
    dash.addConditionalFormatting({ ref: `B${staffStartRow}:B${row - 1}`, rules: [dataBarRule(argb(COLORS.brand), 1)] });
  } else {
    dash.getCell(row, 1).value = 'No sales this year.';
    row++;
  }
  row++;

  sectionHeader('Payment Status Breakdown (sales started this year)');
  tableHeader(['Status', 'Count', `Value (${currencySymbol})`]);
  for (const p of stats.paymentStatus) {
    dash.getCell(row, 1).value = p.label;
    dash.getCell(row, 2).value = p.count;
    dash.getCell(row, 3).value = money(p.value);
    dash.getCell(row, 3).numFmt = '#,##0';
    row++;
  }
  row++;

  sectionHeader('Other Metrics');
  tableHeader(['Metric', 'Value']);
  const otherMetrics: [string, string | number][] = [
    ['Profit Margin', `${stats.profitMargin.toFixed(1)}%`],
    ['New vs Used (units)', `${stats.newUnits} / ${stats.usedUnits}`],
    [`New vs Used Revenue (${currencySymbol})`, `${money(stats.newRevenue)} / ${money(stats.usedRevenue)}`],
    [`Items Returned (${currencySymbol} value)`, `${stats.returnedCount} (${money(stats.returnedValue)})`],
  ];
  for (const [label, value] of otherMetrics) {
    dash.getCell(row, 1).value = label;
    dash.getCell(row, 1).font = { bold: true };
    dash.getCell(row, 2).value = value;
    row++;
  }

  // ───────────────────────────────────────────────────────────────────
  // Sheet 2 — Transactions (full audit log for the year)
  // ───────────────────────────────────────────────────────────────────
  const txSheet = workbook.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 1 }] });
  const columns: { header: string; key: string; width: number }[] = [
    { header: 'Receipt No', key: 'receiptNo', width: 14 },
    { header: 'Date Taken', key: 'takenDate', width: 18 },
    { header: 'Item', key: 'itemName', width: 28 },
    { header: 'Category', key: 'itemCategory', width: 16 },
    { header: 'Brand', key: 'itemBrand', width: 14 },
    { header: 'Condition', key: 'itemCondition', width: 10 },
    { header: 'Color', key: 'itemColor', width: 12 },
    { header: 'Customer', key: 'customerName', width: 20 },
    { header: 'Phone', key: 'customerPhone', width: 16 },
    { header: `Total (${currencySymbol})`, key: 'totalAmount', width: 14 },
    { header: `Paid (${currencySymbol})`, key: 'amountPaid', width: 14 },
    { header: `Balance (${currencySymbol})`, key: 'balance', width: 14 },
    { header: 'Payment Status', key: 'paymentStatus', width: 14 },
    { header: 'Transaction Status', key: 'status', width: 16 },
    { header: 'Completed Date', key: 'completedDate', width: 18 },
    { header: 'Returned Date', key: 'returnedDate', width: 18 },
    { header: 'Staff', key: 'staffName', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  txSheet.columns = columns;
  const headerRow = txSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORS.tableHeaderBg) } };
  });

  for (const t of takenInYear) {
    txSheet.addRow({
      receiptNo: t.receiptNo,
      takenDate: new Date(t.takenDate).toLocaleString(),
      itemName: t.itemName,
      itemCategory: t.itemCategory,
      itemBrand: t.itemBrand,
      itemCondition: t.itemCondition,
      itemColor: t.itemColor,
      customerName: t.customerName,
      customerPhone: t.customerPhone ?? '',
      totalAmount: money(t.totalAmount),
      amountPaid: money(t.amountPaid),
      balance: money(t.totalAmount - t.amountPaid),
      paymentStatus: t.paymentStatus,
      status: t.status,
      completedDate: t.completedDate ? new Date(t.completedDate).toLocaleString() : '',
      returnedDate: t.returnedDate ? new Date(t.returnedDate).toLocaleString() : '',
      staffName: t.staffName,
      notes: t.notes ?? '',
    });
  }
  ['J', 'K', 'L'].forEach((col) => {
    txSheet.getColumn(col).numFmt = '#,##0';
  });
  if (takenInYear.length === 0) {
    txSheet.addRow({ receiptNo: 'No transactions recorded for this year.' });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${storeName.replace(/\s+/g, '-')}-Year-End-Report-${year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
