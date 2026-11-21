// Uses exceljs rather than the `xlsx` package: the npm `xlsx` package has
// unpatched prototype-pollution/ReDoS advisories with no fix available, and
// the app already depends on exceljs for the year-end report, so this avoids
// shipping a second, vulnerable spreadsheet library.
export async function exportToExcel(filename: string, sheetName: string, rows: Record<string, unknown>[]) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet.addRow(headers);
  for (const row of rows) {
    worksheet.addRow(headers.map((key) => row[key] ?? ''));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
