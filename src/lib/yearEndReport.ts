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
  brand: 'FF0A6CFF',
  brandDark: 'FF07101F',
  green: 'FF1E9E6B',
  greenLight: 'FFE6F6EF',
  amber: 'FFB7791F',
  amberLight: 'FFFCF0DC',
  rose: 'FFC63D3D',
  roseLight: 'FFFBE9E9',
  headerBg: 'FF0A1A3F',
  white: 'FFFFFFFF',
  grayText: 'FF5B6072',
  tableHeaderBg: 'FFEAF3FF',
};

function money(n: number) {
  return Math.round(n);
}

export async function downloadYearEndReport(
  year: number,
  items: InventoryItem[],
  transactions: Transaction[],
  storeName: string,
  currencySymbol: string
) {
  const ExcelJS = (await import('exceljs')).default;
  const stats = computeYearStats(items, transactions, year);
  const takenInYear = transactions
    .filter((t) => new Date(t.takenDate).getFullYear() === year)
    .sort((a, b) => a.takenDate.localeCompare(b.takenDate));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = storeName;
  workbook.created = new Date();

  // ───────────────────────────────────────────────────────────────────
  // Sheet 1 — Dashboard
  // ───────────────────────────────────────────────────────────────────
  const dash = workbook.addWorksheet('Dashboard', { views: [{ showGridLines: false }] });
  dash.columns = [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];

  let row = 1;

  dash.mergeCells(row, 1, row, 6);
  const title = dash.getCell(row, 1);
  title.value = `${storeName} — Year-End Report ${year}`;
  title.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dash.getRow(row).height = 32;
  row++;

  dash.mergeCells(row, 1, row, 6);
  const subtitle = dash.getCell(row, 1);
  subtitle.value = `Generated ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · currency in ${currencySymbol}`;
  subtitle.font = { italic: true, size: 10, color: { argb: COLORS.grayText } };
  row += 2;

  // Key metrics
  function kpiRow(label: string, value: string | number, fill?: string) {
    const r = dash.getRow(row);
    dash.getCell(row, 1).value = label;
    dash.getCell(row, 1).font = { bold: true, size: 11 };
    dash.mergeCells(row, 2, row, 3);
    const valueCell = dash.getCell(row, 2);
    valueCell.value = value;
    valueCell.font = { bold: true, size: 13 };
    valueCell.alignment = { horizontal: 'right' };
    if (typeof value === 'number') valueCell.numFmt = '#,##0';
    if (fill) {
      dash.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    }
    r.height = 20;
    row++;
  }

  dash.mergeCells(row, 1, row, 6);
  dash.getCell(row, 1).value = 'Key Metrics';
  dash.getCell(row, 1).font = { bold: true, size: 13 };
  row++;

  kpiRow(`Total Revenue (${currencySymbol})`, money(stats.revenue), COLORS.greenLight);
  kpiRow(`Total Profit (${currencySymbol})`, money(stats.profit), COLORS.greenLight);
  kpiRow('Profit Margin', `${stats.profitMargin.toFixed(1)}%`);
  kpiRow('Units Sold', stats.unitsSold);
  kpiRow(`Average Sale Value (${currencySymbol})`, money(stats.avgSaleValue));
  kpiRow('New vs Used (units)', `${stats.newUnits} / ${stats.usedUnits}`);
  kpiRow(`New vs Used Revenue (${currencySymbol})`, `${money(stats.newRevenue)} / ${money(stats.usedRevenue)}`);
  kpiRow(`Outstanding From This Year's Sales (${currencySymbol})`, money(stats.outstandingFromYear), COLORS.amberLight);
  kpiRow(`Items Returned (${currencySymbol} value)`, `${stats.returnedCount} (${money(stats.returnedValue)})`, stats.returnedCount > 0 ? COLORS.roseLight : undefined);
  kpiRow('Best Month', stats.bestMonth ? `${stats.bestMonth.label} (${currencySymbol}${money(stats.bestMonth.revenue).toLocaleString()})` : '—');
  kpiRow('Lowest Month', stats.worstMonth ? `${stats.worstMonth.label} (${currencySymbol}${money(stats.worstMonth.revenue).toLocaleString()})` : '—');
  row++;

  function sectionHeader(label: string) {
    dash.mergeCells(row, 1, row, 6);
    const cell = dash.getCell(row, 1);
    cell.value = label;
    cell.font = { bold: true, size: 13, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.brand } };
    dash.getRow(row).height = 22;
    row++;
  }

  function tableHeader(cols: string[]) {
    cols.forEach((c, i) => {
      const cell = dash.getCell(row, i + 1);
      cell.value = c;
      cell.font = { bold: true, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
    });
    row++;
  }

  // Monthly trend
  sectionHeader('Monthly Revenue Trend');
  tableHeader(['Month', `Revenue (${currencySymbol})`, 'Units Sold']);
  const monthlyStartRow = row;
  for (const m of stats.monthly) {
    dash.getCell(row, 1).value = m.label;
    dash.getCell(row, 2).value = money(m.revenue);
    dash.getCell(row, 2).numFmt = '#,##0';
    dash.getCell(row, 3).value = m.units;
    row++;
  }
  dash.addConditionalFormatting({
    ref: `B${monthlyStartRow}:B${row - 1}`,
    rules: [dataBarRule(COLORS.brand, 1)],
  });
  row++;

  // Category breakdown
  sectionHeader('Sales by Category');
  tableHeader(['Category', `Revenue (${currencySymbol})`, 'Units Sold']);
  const catStartRow = row;
  for (const c of stats.byCategory) {
    dash.getCell(row, 1).value = c.label;
    dash.getCell(row, 2).value = money(c.revenue);
    dash.getCell(row, 2).numFmt = '#,##0';
    dash.getCell(row, 3).value = c.units;
    row++;
  }
  if (stats.byCategory.length > 0) {
    dash.addConditionalFormatting({
      ref: `B${catStartRow}:B${row - 1}`,
      rules: [dataBarRule(COLORS.green, 2)],
    });
  }
  row++;

  // Top items
  sectionHeader('Top 10 Best-Selling Items');
  tableHeader(['Item', `Revenue (${currencySymbol})`, 'Units Sold']);
  for (const it of stats.topItems) {
    dash.getCell(row, 1).value = it.label;
    dash.getCell(row, 2).value = money(it.revenue);
    dash.getCell(row, 2).numFmt = '#,##0';
    dash.getCell(row, 3).value = it.units;
    row++;
  }
  if (stats.topItems.length === 0) {
    dash.getCell(row, 1).value = 'No sales this year.';
    row++;
  }
  row++;

  // Top customers
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

  // Staff leaderboard
  sectionHeader('Staff Performance');
  tableHeader(['Staff', `Revenue (${currencySymbol})`, 'Units Sold']);
  for (const s of stats.staffLeaderboard) {
    dash.getCell(row, 1).value = s.name;
    dash.getCell(row, 2).value = money(s.revenue);
    dash.getCell(row, 2).numFmt = '#,##0';
    dash.getCell(row, 3).value = s.units;
    row++;
  }
  if (stats.staffLeaderboard.length === 0) {
    dash.getCell(row, 1).value = 'No sales this year.';
    row++;
  }
  row++;

  // Payment status breakdown
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

  // Insights
  sectionHeader('Insights');
  const insights: string[] = [];
  if (stats.bestMonth) insights.push(`${stats.bestMonth.label} was your strongest month, bringing in ${currencySymbol}${money(stats.bestMonth.revenue).toLocaleString()}.`);
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
  for (const line of insights) {
    dash.mergeCells(row, 1, row, 6);
    const cell = dash.getCell(row, 1);
    cell.value = `•  ${line}`;
    cell.alignment = { wrapText: true };
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
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
