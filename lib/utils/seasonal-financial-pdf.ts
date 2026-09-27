import { jsPDF } from 'jspdf';
import { FarmFinancialSummary } from '@/lib/services/farm-finance.service';

export function exportSeasonalFinancialReportPDF(
  summary: FarmFinancialSummary,
  farmerName: string = 'Farmer',
  expenses: any[] = [],
  investments: any[] = []
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(22, 101, 52); // #166534 Dark Green
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AGRILINK FARM FINANCIAL STATEMENT', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Season: ${summary.season || 'Annual'} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 19);
  doc.text(`Farmer: ${farmerName} | Operational Area: ${summary.totalAcreage} Acres`, 14, 24);

  y = 36;

  // Key Financial Metrics Card Grid
  doc.setTextColor(31, 59, 44);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EXECUTIVE FINANCIAL SUMMARY & P&L', 14, y);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 38, 3, 3, 'FD');

  const colW = (pageWidth - 28) / 3;

  // Column 1: Gross Revenue
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GROSS HARVEST REVENUE', 20, y + 8);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(`INR ${summary.totalRevenue.toLocaleString('en-IN')}`, 20, y + 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`INR ${Math.round(summary.revenuePerAcre).toLocaleString('en-IN')} / Acre`, 20, y + 22);

  // Column 2: Total Operating Cost
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('OPERATIONAL EXPENSES', 20 + colW, y + 8);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Red
  doc.text(`INR ${summary.totalExpenses.toLocaleString('en-IN')}`, 20 + colW, y + 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`INR ${Math.round(summary.costPerAcre).toLocaleString('en-IN')} / Acre`, 20 + colW, y + 22);

  // Column 3: Net Profit & ROI
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('NET FARM PROFIT & ROI', 20 + colW * 2, y + 8);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(summary.netProfit >= 0 ? 22 : 225, summary.netProfit >= 0 ? 101 : 29, summary.netProfit >= 0 ? 52 : 72);
  doc.text(`INR ${summary.netProfit.toLocaleString('en-IN')}`, 20 + colW * 2, y + 16);
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text(`ROI: ${summary.roiPercentage.toFixed(1)}% | Margin: ${summary.profitMarginPercentage.toFixed(1)}%`, 20 + colW * 2, y + 22);

  y += 46;

  // 2. Crop Performance & ROI Breakdown Table
  doc.setTextColor(31, 59, 44);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CROP-WISE RETURN ON INVESTMENT (ROI)', 14, y);
  y += 5;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Crop Name', 16, y + 5);
  doc.text('Area', 55, y + 5);
  doc.text('Expenses', 80, y + 5);
  doc.text('Revenue', 115, y + 5);
  doc.text('Net Profit', 145, y + 5);
  doc.text('ROI %', 178, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  if (summary.cropPerformance && summary.cropPerformance.length > 0) {
    summary.cropPerformance.forEach(c => {
      doc.text(c.cropName, 16, y + 5);
      doc.text(`${c.acreage} ac`, 55, y + 5);
      doc.text(`INR ${c.expenses.toLocaleString('en-IN')}`, 80, y + 5);
      doc.text(`INR ${c.revenue.toLocaleString('en-IN')}`, 115, y + 5);
      doc.text(`INR ${c.netProfit.toLocaleString('en-IN')}`, 145, y + 5);
      doc.text(`${c.roiPercentage.toFixed(1)}%`, 178, y + 5);
      y += 6;
    });
  } else {
    doc.text('No crop breakdown available for this season.', 16, y + 5);
    y += 6;
  }

  y += 6;

  // 3. Categorical Expenses Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 59, 44);
  doc.text('3. OPERATIONAL COST BREAKDOWN (SEEDS, FERTILIZER, DIESEL, LABOUR)', 14, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Expense Category', 16, y + 5);
  doc.text('Total Incurred (INR)', 85, y + 5);
  doc.text('Share of Budget %', 145, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  Object.entries(summary.expensesByCategory).forEach(([cat, data]) => {
    if (data.totalAmount > 0) {
      const formattedName = cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      doc.text(formattedName, 16, y + 5);
      doc.text(`INR ${data.totalAmount.toLocaleString('en-IN')}`, 85, y + 5);
      doc.text(`${data.percentage.toFixed(1)}%`, 145, y + 5);
      y += 6;
    }
  });

  y += 6;

  // 4. Capital Investment Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 59, 44);
  doc.text('4. CAPITAL ASSETS & INVESTMENT LEDGER', 14, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Asset / Investment Title', 16, y + 5);
  doc.text('Type', 85, y + 5);
  doc.text('Capital Amount', 130, y + 5);
  doc.text('Date', 170, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  if (investments && investments.length > 0) {
    investments.slice(0, 5).forEach(inv => {
      doc.text(inv.title || 'Capital Asset', 16, y + 5);
      doc.text(String(inv.investmentType || 'Self').replace('_', ' '), 85, y + 5);
      doc.text(`INR ${Number(inv.capitalAmount || 0).toLocaleString('en-IN')}`, 130, y + 5);
      doc.text(inv.investmentDate ? new Date(inv.investmentDate).toLocaleDateString('en-IN') : ' - ', 170, y + 5);
      y += 6;
    });
  } else {
    doc.text('No fixed capital asset investments recorded for this period.', 16, y + 5);
    y += 6;
  }

  // Footer / Certification Stamp
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('AgriLink Smart Farming Financial Engine · Verified Farm-Level Balance Sheet · Exported via AgriLink', 14, footerY + 5);
  doc.text('Deterministic Zero-Loss Standard Ledger', pageWidth - 70, footerY + 5);

  doc.save(`AgriLink_Financial_Report_${summary.season.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
