export type InvoiceCustomer = {
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  placeOfSupply?: string;
};

export type InvoiceLine = {
  name: string;
  description?: string;
  qty: number;
  unit_price: number;
  discount_percent: number;
  taxable_value: number;
  total: number;
  share_percent: number;
};

export type InvoicePayload = {
  invoiceNo: number;
  date: string;
  reference?: string;
  customer: InvoiceCustomer;
  items: InvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  taxPercent?: number;
};

function numberToWords(value: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  if (value === 0) return 'Zero';
  const words: string[] = [];
  let remaining = Math.floor(value);

  const chunkToWords = (chunk: number): string => {
    const parts: string[] = [];
    if (chunk >= 100) {
      parts.push(`${units[Math.floor(chunk / 100)]} Hundred`);
      chunk %= 100;
    }
    if (chunk >= 20) {
      parts.push(tens[Math.floor(chunk / 10)]);
      if (chunk % 10) parts.push(units[chunk % 10]);
    } else if (chunk >= 10) {
      parts.push(teens[chunk - 10]);
    } else if (chunk > 0) {
      parts.push(units[chunk]);
    }
    return parts.join(' ');
  };

  let scaleIndex = 0;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk) {
      const prefix = chunkToWords(chunk);
      const scale = scales[scaleIndex];
      words.unshift(prefix + (scale ? ` ${scale}` : ''));
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }
  return words.join(' ').trim();
}

function hashString(data: string): number {
  let hash = 5381;
  for (let i = 0; i < data.length; i += 1) {
    hash = ((hash << 5) + hash) + data.charCodeAt(i);
  }
  return hash >>> 0;
}

function generateQrSvg(data: string, modules = 26, cell = 5): string {
  const width = modules * cell;
  const pieces: string[] = [];
  let state = hashString(data);
  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      const mask = ((state >> ((x + y) % 32)) & 1) ^ ((x + y) % 2);
      if (mask) {
        pieces.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" />`);
      }
      state = (state * 1664525 + 1013904223) >>> 0;
    }
  }
  return `<svg width="${width}" height="${width}" viewBox="0 0 ${width} ${width}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><g fill="#0b1220">${pieces.join('')}</g></svg>`;
}

export function buildInvoiceHtml(payload: InvoicePayload): string {
  const date = new Date(payload.date);
  const invoiceDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const totalQty = payload.items.reduce((sum, line) => sum + line.qty, 0);
  const taxPercent = payload.taxPercent ?? 0;
  const taxAmount = Number(((payload.total * taxPercent) / 100).toFixed(2));
  const afterTaxTotal = Number((payload.total + taxAmount).toFixed(2));
  const words = `${numberToWords(Math.round(payload.total))} Rupees Only`;
  const qrData = `BabyBox|Invoice:${payload.invoiceNo}|Total:${payload.total.toFixed(2)}|Ref:${payload.reference || 'N/A'}`;
  const qrSvg = generateQrSvg(qrData, 26, 6);

  const customerAddress = payload.customer.address ? payload.customer.address.replace(/\n/g, '<br/>') : '-';
  const customerGST = payload.customer.gstin || '-';
  const customerPhone = payload.customer.phone || '-';
  const placeOfSupply = payload.customer.placeOfSupply || '-';

  const lineRows = payload.items.map((line, idx) => {
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${line.name}</strong>
          ${line.description ? `<div class="muted">${line.description}</div>` : ''}
        </td>
        <td>—</td>
        <td>${line.qty}</td>
        <td>₹${line.unit_price.toFixed(2)}</td>
        <td>₹${line.taxable_value.toFixed(2)}</td>
        <td>${line.discount_percent.toFixed(2)}%</td>
        <td>₹${line.total.toFixed(2)}</td>
      </tr>`;
  }).join('');

  const shareRows = payload.items.map((line, idx) => {
    const shareText = payload.total
      ? `${line.share_percent.toFixed(1)}%`
      : '0.0%';
    return `<li>${line.name || `Item ${idx + 1}`} — ${shareText} (${line.qty} pcs)</li>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${payload.invoiceNo}</title>
      <style>
        body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #fff; color: #0b1220; }
        .page { padding: 24px 32px; }
        header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0b1220; padding-bottom: 12px; }
        header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        header .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; }
        .meta { margin-top: 18px; display: flex; justify-content: space-between; gap: 16px; }
        .box { border: 1px solid #d7e1ea; border-radius: 8px; padding: 12px 14px; flex: 1; font-size: 12px; }
        .box strong { display: block; margin-bottom: 4px; font-size: 11px; color: #6b7280; }
        .grid-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
        .table-wrap { margin-top: 18px; border: 1px solid #d7e1ea; border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        table thead { background: #eef2ff; }
        table th, table td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #d7e1ea; }
        table th { text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #0b1220; }
        .muted { color: #6b7280; font-size: 10px; margin-top: 2px; }
        .totals { margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .totals .panel { border: 1px solid #d7e1ea; border-radius: 10px; padding: 10px; background: #f9fafb; }
        .totals .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .totals .value { font-size: 16px; font-weight: 600; }
        .lower { margin-top: 22px; display: flex; gap: 12px; }
        .qr { border: 1px solid #d7e1ea; padding: 10px; border-radius: 10px; width: 170px; }
        .qr img, .qr svg { width: 100%; height: auto; }
        .billing-list { margin: 0; padding-left: 16px; font-size: 10px; color: #0b1220; }
        .billing-list li { margin-bottom: 4px; }
        .bank { margin-top: 16px; border: 1px solid #d7e1ea; border-radius: 10px; padding: 12px; font-size: 11px; }
        footer { margin-top: 28px; border-top: 1px solid #d7e1ea; padding-top: 12px; font-size: 10px; color: #4b5563; display: flex; justify-content: space-between; align-items: flex-start; }
      </style>
    </head>
    <body>
      <div class="page">
        <header>
          <div>
            <h1>KD COLLECTION</h1>
            <div class="tagline">D-33 Shyam Park extension  Rajendra nagar Ghaziabad, Phn. No 8448802078</div>
          </div>
          <div style="text-align:right">
            <strong>Tax Invoice</strong>
            <div style="font-size:12px; margin-top:6px;">Original for Recipient</div>
          </div>
        </header>

        <div class="meta">
          <div class="box">
            <strong>Customer Detail</strong>
            <div><strong>Name:</strong> ${payload.customer.name || '-'}</div>
            <div><strong>Address:</strong><br/>${customerAddress}</div>
            <div><strong>Phone:</strong> ${customerPhone}</div>
            <div><strong>GSTIN:</strong> ${customerGST}</div>
            <div><strong>Place of Supply:</strong> ${placeOfSupply}</div>
          </div>
          <div class="box">
            <strong>Invoice No.</strong>
            <div>${payload.invoiceNo}</div>
            <strong>Invoice Date</strong>
            <div>${invoiceDate} · ${invoiceTime}</div>
            <strong>Reference</strong>
            <div>${payload.reference || '-'}</div>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Name of Product / Service</th>
                <th>HSN / SAC</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Taxable Value</th>
                <th>Discount %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineRows}
              <tr>
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>${totalQty}</strong></td>
                <td></td>
                <td><strong>₹${payload.subtotal.toFixed(2)}</strong></td>
                <td>-</td>
                <td><strong>₹${payload.total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="panel">
            <div class="label">Total in words</div>
            <div class="value">${words}</div>
          </div>
          <div class="panel">
            <div class="label">Taxable Amount</div>
            <div class="value">₹${payload.total.toFixed(2)}</div>
          </div>
          <div class="panel">
            <div class="label">Add: IGST (${taxPercent.toFixed(1)}%)</div>
            <div class="value">₹${taxAmount.toFixed(2)}</div>
          </div>

          <div class="panel">
            <div class="label">Total Amount After Tax</div>
            <div class="value">₹${afterTaxTotal.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="bank">
          <strong>Terms and Conditions</strong>
          <div>Subject to Uttar Pradesh Jurisdiction.</div>
          <div>Our responsibility ceases as soon as goods leave our premises.</div>
          <div>Goods once sold will not be taken back.</div>
          <div>Delivery Ex-Premises.</div>
        </div>

        <footer>
          <div>
            <div>Certified that the particulars given above are true and correct.</div>
            <div style="margin-top:24px; font-weight:700;">We are a composite gst firm we don't charge gst from customers</div>
          </div>
          <div style="text-align:right; font-size:11px;">Authorised Signatory</div>
        </footer>
      </div>
    </body>
    </html>`;

  return html;
}
