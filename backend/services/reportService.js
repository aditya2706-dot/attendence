const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Admin = require('../models/Admin');
const { Parser } = require('json2csv');

const sendWeeklyReport = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await Attendance.find({
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: -1 });

    if (logs.length === 0) return;

    // Convert to CSV
    const fields = ['name', 'employeeId', 'department', 'timestamp', 'status', 'confidence'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs);

    // Get Admin emails
    const admins = await Admin.find({});
    const adminEmails = admins.map(a => a.email).join(',');

    // Setup Transporter (Using Ethereal for testing, or actual SMTP)
    // NOTE: In production, use real credentials via process.env
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: 'ethereal_user@example.com', // Replace with real
        pass: 'ethereal_pass@example.com', // Replace with real
      },
    });

    const mailOptions = {
      from: '"AI Attendance System" <reports@ai-attendance.com>',
      to: adminEmails || 'admin@example.com',
      subject: "Weekly Attendance Summary Report",
      text: "Attached is the attendance report for the last 7 days.",
      attachments: [
        {
          filename: `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`,
          content: csv
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Weekly Report Sent: %s", info.messageId);
  } catch (error) {
    console.error("Report Generation Failed:", error);
  }
};

// Schedule: Every Monday at 9:00 AM
const initReportScheduler = () => {
  cron.schedule('0 9 * * 1', () => {
    console.log('Running weekly report cron job...');
    sendWeeklyReport();
  });
};

module.exports = { initReportScheduler, sendWeeklyReport };
