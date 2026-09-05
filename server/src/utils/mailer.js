import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Build Nodemailer Transporter
 */
export const getMailTransporter = () => {
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER || '';
  const pass = process.env.MAIL_PASSWORD || '';

  // If user & password are provided, create standard SMTP transporter
  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
  }

  // Fallback: JSON / test stream transport if credentials not configured
  // Allows testing and execution in dev/test environments without real SMTP
  return nodemailer.createTransport({
    jsonTransport: true
  });
};

/**
 * Generate professional responsive HTML payslip email template
 */
export const generatePayslipEmailHtml = (payslip) => {
  const {
    employee_first_name,
    employee_last_name,
    employee_code,
    department_name,
    job_title,
    period_start,
    period_end,
    gross_salary,
    total_deductions,
    net_salary,
    lines = []
  } = payslip;

  const earningsLines = lines.filter((l) => {
    const cat = (l.category || '').toLowerCase();
    return cat === 'basic' || cat === 'alw' || cat === 'allowance';
  });

  const deductionLines = lines.filter((l) => {
    const cat = (l.category || '').toLowerCase();
    return cat === 'ded' || cat === 'deduction';
  });

  const earningsHtml = earningsLines
    .map(
      (l) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${l.name} (${l.code})</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-align: right; font-weight: 500;">$${Number(l.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join('');

  const deductionsHtml = deductionLines
    .map(
      (l) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${l.name} (${l.code})</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #dc2626; text-align: right; font-weight: 500;">-$${Number(l.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
    .content { padding: 24px; }
    .meta-grid { display: flex; flex-wrap: wrap; background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #f1f5f9; }
    .meta-item { flex: 1 1 50%; margin-bottom: 8px; }
    .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .meta-val { font-size: 14px; color: #0f172a; font-weight: 600; }
    .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 20px 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    .net-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px; text-align: center; margin-top: 24px; }
    .net-label { font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .net-val { font-size: 28px; color: #1e3a8a; font-weight: 800; margin-top: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PeoplePay360 Payslip</h1>
      <p>Pay Period: ${period_start} to ${period_end}</p>
    </div>
    <div class="content">
      <p style="font-size: 14px; color: #334155; margin-top: 0;">
        Dear <strong>${employee_first_name} ${employee_last_name}</strong>,
      </p>
      <p style="font-size: 13px; color: #475569;">
        Your payslip for the pay period <strong>${period_start}</strong> to <strong>${period_end}</strong> has been generated and published.
      </p>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Employee Code</div>
          <div class="meta-val">${employee_code}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Department</div>
          <div class="meta-val">${department_name || 'General'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Designation</div>
          <div class="meta-val">${job_title || 'Employee'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Payroll Period</div>
          <div class="meta-val">${period_start} — ${period_end}</div>
        </div>
      </div>

      <div class="section-title">Earnings & Allowances</div>
      <table>
        <thead>
          <tr style="background: #f1f5f9; color: #475569; text-align: left;">
            <th style="padding: 8px 12px;">Component</th>
            <th style="padding: 8px 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${earningsHtml || '<tr><td colspan="2" style="padding: 8px 12px; color: #94a3b8;">No allowances recorded</td></tr>'}
          <tr style="background: #f8fafc; font-weight: 700;">
            <td style="padding: 10px 12px; color: #0f172a;">Total Gross Salary</td>
            <td style="padding: 10px 12px; color: #0f172a; text-align: right;">$${Number(gross_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Deductions</div>
      <table>
        <thead>
          <tr style="background: #f1f5f9; color: #475569; text-align: left;">
            <th style="padding: 8px 12px;">Component</th>
            <th style="padding: 8px 12px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${deductionsHtml || '<tr><td colspan="2" style="padding: 8px 12px; color: #94a3b8;">No deductions recorded</td></tr>'}
          <tr style="background: #f8fafc; font-weight: 700;">
            <td style="padding: 10px 12px; color: #dc2626;">Total Deductions</td>
            <td style="padding: 10px 12px; color: #dc2626; text-align: right;">-$${Number(total_deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div class="net-card">
        <div class="net-label">Net Payable Salary</div>
        <div class="net-val">$${Number(net_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
    <div class="footer">
      This is an automated payroll notification generated by PeoplePay360. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send an individual payslip email to an employee
 *
 * @param {object} options
 * @param {string} options.to - Recipient employee email
 * @param {object} options.payslip - Full payslip object with lines
 * @param {string} [options.pdfBase64] - Optional base64-encoded PDF from frontend
 * @param {string} [options.pdfFilename] - Optional attachment filename
 */
export const sendPayslipEmail = async (options) => {
  const {
    to,
    payslip,
    pdfBase64,
    pdfFilename
  } = options;

  if (!to || typeof to !== 'string') {
    throw new Error('Valid recipient email address is required');
  }

  const transporter = getMailTransporter();
  const htmlContent = generatePayslipEmailHtml(payslip);

  const mailOptions = {
    from: process.env.MAIL_FROM || '"PeoplePay360 Payroll" <payroll@peoplepay360.com>',
    to: to.trim(),
    subject: `Payslip for ${payslip.period_start} to ${payslip.period_end} - ${payslip.employee_first_name} ${payslip.employee_last_name}`,
    html: htmlContent
  };

  // If frontend supplied a generated PDF buffer/base64 attachment
  if (pdfBase64) {
    const filename = pdfFilename || `Payslip_${payslip.employee_code}_${payslip.period_start}.pdf`;
    mailOptions.attachments = [
      {
        filename,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ];
  }

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId || 'simulated_mail_id',
    recipient: to
  };
};

export default {
  getMailTransporter,
  generatePayslipEmailHtml,
  sendPayslipEmail
};
