import jsPDF from 'jspdf';

const FOREST = [13, 36, 25];
const MINT = [94, 234, 212];
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];

const fmtRs = (n) => `Rs ${Number(n).toLocaleString()}`;
const fmtDate = (s) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s || '';
  return d.toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Build and download a one-page PDF receipt for an order.
 * `order` is the OrderOut shape from the backend.
 * `extra.partyLabel` overrides "BILL TO" → "SHIP TO" for the supplier copy.
 */
export function downloadReceipt(order, extra = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const w = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header band
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, w, 22, 'F');
  doc.setTextColor(...MINT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AgriFlow', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Fertilizer & Agri-Supply Marketplace', margin, 18);

  // Order ID + status — top right of header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`#ORD-${order.order_id}`, w - margin, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(String(order.status || '').toUpperCase(), w - margin, 17, { align: 'right' });

  let y = 30;
  doc.setTextColor(...INK);

  // Meta block
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Issued', margin, y);
  doc.text(extra.partyLabel || 'BILL TO', w / 2, y);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(fmtDate(order.ordered_at), margin, y + 5);
  doc.text(order.farmer_name || '—', w / 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addr = doc.splitTextToSize(order.delivery_addr || '', (w / 2) - margin);
  doc.text(addr, w / 2, y + 10);

  y += 22;

  // Items table
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(margin, y, w - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('ITEM', margin, y);
  doc.text('QTY', w - 60, y, { align: 'right' });
  doc.text('PRICE', w - 38, y, { align: 'right' });
  doc.text('TOTAL', w - margin, y, { align: 'right' });
  y += 2;
  doc.line(margin, y, w - margin, y);
  y += 5;

  doc.setTextColor(...INK);
  doc.setFontSize(9.5);

  for (const item of order.items || []) {
    const nameLines = doc.splitTextToSize(item.product_name || '—', w - 80);
    doc.setFont('helvetica', 'bold');
    doc.text(nameLines, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.quantity), w - 60, y, { align: 'right' });
    doc.text(fmtRs(item.unit_price_snapshot), w - 38, y, { align: 'right' });
    doc.text(fmtRs(item.line_total), w - margin, y, { align: 'right' });
    y += 5 * Math.max(nameLines.length, 1) + 2;
    if (y > 175) break;
  }

  y += 2;
  doc.line(margin, y, w - margin, y);
  y += 6;

  // Total row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...FOREST);
  doc.text('TOTAL', w - 50, y, { align: 'right' });
  doc.text(fmtRs(order.total_amount), w - margin, y, { align: 'right' });
  y += 8;

  // Payment status pill
  if (order.payment_status) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Payment: ${order.payment_status}`, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(...MUTED);
  doc.line(margin, footerY - 3, w - margin, footerY - 3);
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Thank you for ordering with AgriFlow.', margin, footerY);
  doc.text(
    'Questions? support@agriflow.pk',
    w - margin,
    footerY,
    { align: 'right' },
  );

  doc.save(`agriflow-order-${order.order_id}.pdf`);
}
