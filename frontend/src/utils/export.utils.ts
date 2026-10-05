import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ColumnDef {
  header: string;
  dataKey: string;
}

export interface PDFExportOptions {
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  companyName?: string;
}

/**
 * Format current date string for clean filenames: YYYY-MM-DD_HH-mm
 */
export function getExportTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return `${dateStr}_${timeStr}`;
}

/**
 * Clean and format a value for display or export
 */
function formatValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val instanceof Date) return val.toLocaleString();
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Escape CSV fields according to RFC 4180
 */
function escapeCSVField(field: any): string {
  const str = formatValue(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export data array to CSV file with UTF-8 BOM
 */
export function exportToCSV(
  data: any[],
  filename = 'export',
  columnHeaders?: Record<string, string>
): void {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  // Determine keys from first row or columnHeaders
  const keys = columnHeaders ? Object.keys(columnHeaders) : Object.keys(data[0]);
  const headers = keys.map((k) => (columnHeaders && columnHeaders[k] ? columnHeaders[k] : k));

  // Build CSV rows
  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCSVField).join(','));

  for (const row of data) {
    const rowValues = keys.map((key) => escapeCSVField(row[key]));
    csvRows.push(rowValues.join(','));
  }

  // Prepend UTF-8 BOM so Excel opens non-ASCII chars cleanly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data array to native Microsoft Excel (.xlsx) file
 */
export function exportToExcel(
  data: any[],
  filename = 'export',
  sheetName = 'Report',
  columnHeaders?: Record<string, string>
): void {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const keys = columnHeaders ? Object.keys(columnHeaders) : Object.keys(data[0]);

  // Transform data to use friendly header labels
  const formattedData = data.map((row) => {
    const formattedRow: Record<string, any> = {};
    for (const key of keys) {
      const headerLabel = columnHeaders && columnHeaders[key] ? columnHeaders[key] : key;
      const val = row[key];
      // Format complex objects or dates
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        formattedRow[headerLabel] = JSON.stringify(val);
      } else {
        formattedRow[headerLabel] = val ?? '';
      }
    }
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto-calculate column widths
  const colWidths = keys.map((key) => {
    const headerLabel = columnHeaders && columnHeaders[key] ? columnHeaders[key] : key;
    let maxLen = headerLabel.length;
    for (const row of data) {
      const cellVal = String(row[key] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = Math.min(cellVal.length, 50); // cap max width at 50
      }
    }
    return { wch: Math.max(maxLen + 3, 12) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * Export data array to professional styled PDF report
 */
export function exportToPDF(
  title: string,
  columns: ColumnDef[],
  data: any[],
  filename = 'report',
  options?: PDFExportOptions
): void {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  // Choose orientation: portrait if <= 5 columns, else landscape
  const orientation = options?.orientation || (columns.length > 5 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Branding Colors: S2S Royal Maroon / Rose Primary
  const primaryColor: [number, number, number] = [190, 24, 93]; // #be185d Rose-700
  const secondaryColor: [number, number, number] = [71, 85, 105]; // #475569 Slate-600

  // 1. Header Block
  doc.setFillColor(253, 242, 248); // Rose-50 background tint
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('S2S COMMUNITY MATRIMONY', 40, 32);

  // Sub-brand / Company Tag
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Administrative & Operational Intelligence System', 40, 48);

  // Report Title (Right-aligned or below)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(title, 40, 100);

  // Report Subtitle & Generated Timestamp
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const subText = options?.subtitle
    ? `${options.subtitle} • Generated: ${formattedDate}`
    : `Generated on: ${formattedDate} • Total Records: ${data.length}`;
  doc.text(subText, 40, 116);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(1);
  doc.line(40, 126, pageWidth - 40, 126);

  // Prepare table data
  const tableHeaders = columns.map((c) => c.header);
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.dataKey];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') {
        if (val instanceof Date) return val.toLocaleDateString();
        return JSON.stringify(val);
      }
      return String(val);
    })
  );

  // Generate Table using autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 135,
    margin: { left: 40, right: 40, bottom: 50 },
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 6,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (hookData) => {
      // Footer on every page
      const currentYear = now.getFullYear();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400

      // Left footer
      doc.text(
        `© ${currentYear} S2S Matrimony • Confidential System Document`,
        40,
        pageHeight - 20
      );

      // Right footer
      const pageInfo = `Page ${hookData.pageNumber}`;
      doc.text(pageInfo, pageWidth - 40 - doc.getTextWidth(pageInfo), pageHeight - 20);
    },
  });

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}
