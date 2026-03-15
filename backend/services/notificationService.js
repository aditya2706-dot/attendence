const axios = require('axios');

const sendNotification = async (message) => {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log("Notification (Mock):", message);
      return;
    }

    await axios.post(webhookUrl, {
      text: `🔔 *Attendance Alert*\n${message}`,
    });
    console.log("Real-time notification sent.");
  } catch (error) {
    console.error("Notification failed:", error.message);
  }
};

module.exports = { sendNotification };
