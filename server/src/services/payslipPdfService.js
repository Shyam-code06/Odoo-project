import PDFDocument from 'pdfkit';

/**
 * Payslip PDF Generation Service using PDFKit
 * Streams high quality, print-friendly A4 payslip documents directly to HTTP response.
 */
export class PayslipPdfService {
  /**
   * Helper: Format currency in Indian Rupee / standard format
   */
  formatAmount(amount) {
    const num = Number(amount) || 0;
    return `Rs. ${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Helper: Format date string to readable format
   */
  formatDateStr(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  }

  /**
   * Generate and stream Payslip PDF directly into the Express HTTP response
   *
   * @param {object} payslip - Comprehensive payslip data with lines and relational info
   * @param {object} res - Express response stream
   */
  async streamPayslipPdf(payslip, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
          info: {
            Title: `Payslip - ${payslip.employee_code || payslip.employee_first_name || 'Employee'}`,
            Author: 'HRMS Enterprise OXP',
            Subject: `Salary Statement for period ${payslip.period_start} to ${payslip.period_end}`,
            Keywords: 'Payslip, Salary, Payroll, HRMS'
          }
        });

        // Error handling on PDFKit stream
        doc.on('error', (err) => {
          reject(err);
        });

        // Pipe directly to HTTP response stream
        doc.pipe(res);

        const primaryOrange = '#EA580C';
        const darkSlate = '#0F172A';
        const bodyText = '#334155';
        const mutedText = '#64748B';
        const lightBg = '#F8FAFC';
        const borderColor = '#E2E8F0';
        const orangeLightBg = '#FFF7ED';
        const orangeBorder = '#FDBA74';

        const pageWidth = doc.page.width - 80; // 595.28 - 80 = 515.28 pt
        const startX = 40;

        // -------------------------------------------------------------
        // 1. Top Header: Company Identity & Payslip Reference
        // -------------------------------------------------------------
        let currentY = 40;

        // Company Logo Box (Orange icon with white 'H')
        doc
          .roundedRect(startX, currentY, 36, 36, 6)
          .fill(primaryOrange);

        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(20)
          .text('H', startX + 11, currentY + 7);

        // Company Information
        doc
          .fillColor(darkSlate)
          .font('Helvetica-Bold')
          .fontSize(16)
          .text('HRMS Enterprise OXP', startX + 46, currentY + 2);

        doc
          .fillColor(mutedText)
          .font('Helvetica')
          .fontSize(8.5)
          .text('123 Technology Innovation Park, Suite 400', startX + 46, currentY + 20)
          .text('Bangalore, KA - 560103 | contact@hrms-oxp.internal', startX + 46, currentY + 31);

        // Right side: Document title & reference
        doc
          .fillColor(darkSlate)
          .font('Helvetica-Bold')
          .fontSize(14)
          .text('SALARY STATEMENT', startX, currentY + 2, { align: 'right', width: pageWidth });

        doc
          .fillColor(mutedText)
          .font('Helvetica')
          .fontSize(9)
          .text(`Payslip Ref: #${payslip.id}`, startX, currentY + 20, { align: 'right', width: pageWidth });

        const statusText = (payslip.status || 'Generated').toUpperCase();
        const statusColor = statusText === 'PAID' ? '#059669' : primaryOrange;
        doc
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(`Status: ${statusText}`, startX, currentY + 32, { align: 'right', width: pageWidth });

        currentY += 50;

        // Divider Line
        doc
          .moveTo(startX, currentY)
          .lineTo(startX + pageWidth, currentY)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();

        currentY += 12;

        // -------------------------------------------------------------
        // 2. Employee Details & Payroll Context Metadata Box
        // -------------------------------------------------------------
        const metaBoxHeight = 84;
        doc
          .roundedRect(startX, currentY, pageWidth, metaBoxHeight, 6)
          .fillAndStroke(lightBg, borderColor);

        const colWidth = (pageWidth - 20) / 2;
        const leftColX = startX + 10;
        const rightColX = startX + colWidth + 20;
        let metaY = currentY + 8;

        // Left Column: Employee Details
        doc
          .fillColor(primaryOrange)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text('EMPLOYEE INFORMATION', leftColX, metaY);

        metaY += 14;
        const employeeName = `${payslip.employee_first_name || ''} ${payslip.employee_last_name || ''}`.trim() || 'Employee';
        
        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Name:', leftColX, metaY);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkSlate).text(employeeName, leftColX + 65, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Employee Code:', leftColX, metaY);
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(payslip.employee_code || '—', leftColX + 65, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Department:', leftColX, metaY);
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(payslip.department_name || 'General', leftColX + 65, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Designation:', leftColX, metaY);
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(payslip.job_title || 'Staff', leftColX + 65, metaY);

        // Right Column: Payroll Context
        metaY = currentY + 8;
        doc
          .fillColor(primaryOrange)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text('PAYROLL CONTEXT', rightColX, metaY);

        metaY += 14;
        const periodStr = `${this.formatDateStr(payslip.period_start)} - ${this.formatDateStr(payslip.period_end)}`;
        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Payroll Period:', rightColX, metaY);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkSlate).text(periodStr, rightColX + 70, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Payrun Ref:', rightColX, metaY);
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(payslip.payrun_name || `#${payslip.payrun_id || '—'}`, rightColX + 70, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Structure:', rightColX, metaY);
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(payslip.structure_name || 'Standard Structure', rightColX + 70, metaY);
        metaY += 13;

        doc.font('Helvetica').fontSize(8.5).fillColor(mutedText).text('Employment:', rightColX, metaY);
        const empType = (payslip.employment_type || 'full_time').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        doc.font('Helvetica').fontSize(8.5).fillColor(darkSlate).text(empType, rightColX + 70, metaY);

        currentY += metaBoxHeight + 16;

        // -------------------------------------------------------------
        // 3. Earnings & Deductions Breakdown Tables
        // -------------------------------------------------------------
        const allLines = payslip.lines || [];
        const earningsLines = allLines.filter((l) => {
          const cat = (l.category || '').toLowerCase();
          return cat === 'basic' || cat === 'alw' || cat === 'allowance' || (!cat.includes('ded') && Number(l.amount) >= 0);
        });

        const deductionLines = allLines.filter((l) => {
          const cat = (l.category || '').toLowerCase();
          return cat === 'ded' || cat === 'deduction' || Number(l.amount) < 0;
        });

        // Function to render table
        const renderTableSection = (title, items, isDeduction = false) => {
          // Section Title Banner
          const barColor = isDeduction ? '#64748B' : primaryOrange;
          doc
            .rect(startX, currentY, 4, 14)
            .fill(barColor);

          doc
            .fillColor(darkSlate)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(title.toUpperCase(), startX + 10, currentY + 2);

          currentY += 18;

          // Table Header Row
          const tableHeaderHeight = 20;
          doc
            .rect(startX, currentY, pageWidth, tableHeaderHeight)
            .fill(lightBg);

          doc
            .moveTo(startX, currentY + tableHeaderHeight)
            .lineTo(startX + pageWidth, currentY + tableHeaderHeight)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

          doc.fillColor(mutedText).font('Helvetica-Bold').fontSize(8);
          doc.text('CODE', startX + 8, currentY + 6);
          doc.text('COMPONENT / DESCRIPTION', startX + 75, currentY + 6);
          doc.text('RATE', startX + 280, currentY + 6, { width: 45, align: 'right' });
          doc.text('QTY', startX + 340, currentY + 6, { width: 35, align: 'right' });
          doc.text('AMOUNT', startX + 400, currentY + 6, { width: pageWidth - 408, align: 'right' });

          currentY += tableHeaderHeight;

          if (items.length === 0) {
            doc
              .fillColor(mutedText)
              .font('Helvetica-Oblique')
              .fontSize(8.5)
              .text(`No ${title.toLowerCase()} items recorded.`, startX + 8, currentY + 8);
            currentY += 24;
          } else {
            let rowIdx = 0;
            for (const item of items) {
              const rowHeight = 20;
              // Alternating row background
              if (rowIdx % 2 === 1) {
                doc.rect(startX, currentY, pageWidth, rowHeight).fill('#FBFDFF');
              }

              doc
                .moveTo(startX, currentY + rowHeight)
                .lineTo(startX + pageWidth, currentY + rowHeight)
                .strokeColor('#F1F5F9')
                .lineWidth(0.5)
                .stroke();

              doc.fillColor(darkSlate).font('Helvetica').fontSize(8.5);
              doc.text(item.code || '—', startX + 8, currentY + 6);
              doc.font('Helvetica-Bold').text(item.name || item.code, startX + 75, currentY + 6, {
                width: 195,
                lineBreak: false,
                ellipsis: true
              });

              doc.font('Helvetica').fillColor(bodyText);
              doc.text(`${item.rate !== undefined ? item.rate : 100}%`, startX + 280, currentY + 6, { width: 45, align: 'right' });
              doc.text(`${item.quantity !== undefined ? item.quantity : 1}`, startX + 340, currentY + 6, { width: 35, align: 'right' });

              const displayAmount = Math.abs(Number(item.amount) || 0);
              const amountStr = isDeduction ? `- ${this.formatAmount(displayAmount)}` : this.formatAmount(displayAmount);
              
              doc.font('Helvetica-Bold').fillColor(isDeduction ? '#DC2626' : darkSlate);
              doc.text(amountStr, startX + 400, currentY + 6, { width: pageWidth - 408, align: 'right' });

              currentY += rowHeight;
              rowIdx++;
            }
          }

          currentY += 8;
        };

        // Render Earnings Table
        renderTableSection('Earnings Breakdown', earningsLines, false);

        // Render Deductions Table
        renderTableSection('Deductions Breakdown', deductionLines, true);

        // -------------------------------------------------------------
        // 4. Salary Totals & Net Take-Home Pay Box
        // -------------------------------------------------------------
        const summaryBoxHeight = 56;
        doc
          .roundedRect(startX, currentY, pageWidth, summaryBoxHeight, 6)
          .fillAndStroke(orangeLightBg, orangeBorder);

        // Left Summary Totals (Gross & Deductions)
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(bodyText)
          .text('Total Gross Earnings:', startX + 14, currentY + 12);

        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(darkSlate)
          .text(this.formatAmount(payslip.gross_salary), startX + 140, currentY + 12);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(bodyText)
          .text('Total Deductions:', startX + 14, currentY + 30);

        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#DC2626')
          .text(this.formatAmount(payslip.total_deductions), startX + 140, currentY + 30);

        // Right Prominent Net Take-Home Pay
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor(primaryOrange)
          .text('NET TAKE-HOME PAY', startX + 280, currentY + 10, { width: pageWidth - 290, align: 'right' });

        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor(primaryOrange)
          .text(this.formatAmount(payslip.net_salary), startX + 280, currentY + 24, { width: pageWidth - 290, align: 'right' });

        currentY += summaryBoxHeight + 16;

        // -------------------------------------------------------------
        // 5. Payment Details & Security Notes
        // -------------------------------------------------------------
        if (currentY < 720) {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor(mutedText)
            .text('• Confidential Statement: This document contains proprietary payroll information intended exclusively for the named employee.', startX, currentY)
            .text('• For inquiries or tax certificate requests, please reach out to the HR & Payroll department.', startX, currentY + 10);
          currentY += 26;
        }

        // -------------------------------------------------------------
        // 6. Page Numbers and Document Footer across all pages
        // -------------------------------------------------------------
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          const footerY = doc.page.height - 35;

          doc
            .moveTo(startX, footerY - 6)
            .lineTo(startX + pageWidth, footerY - 6)
            .strokeColor(borderColor)
            .lineWidth(0.5)
            .stroke();

          doc
            .fillColor(mutedText)
            .font('Helvetica')
            .fontSize(7.5)
            .text('This is a computer-generated document and requires no signature.', startX, footerY)
            .text(
              `Generated on: ${new Date().toISOString().slice(0, 10)}  |  Page ${i + 1} of ${pages.count}`,
              startX,
              footerY,
              { align: 'right', width: pageWidth }
            );
        }

        // Listen for completion
        res.on('finish', () => resolve());
        res.on('error', (err) => reject(err));

        // Finalize PDF Document
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Generate a PDF Buffer for testing or email attachments
   *
   * @param {object} payslip
   * @returns {Promise<Buffer>}
   */
  async generatePdfBuffer(payslip) {
    return new Promise((resolve, reject) => {
      try {
        const { Writable } = require('stream') || {};
      } catch {}

      const chunks = [];
      const { Writable } = import('stream');
      import('stream').then(({ Writable }) => {
        const customStream = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          }
        });
        customStream.on('finish', () => {
          resolve(Buffer.concat(chunks));
        });
        customStream.on('error', (err) => reject(err));
        this.streamPayslipPdf(payslip, customStream).catch(reject);
      });
    });
  }
}

export default new PayslipPdfService();
