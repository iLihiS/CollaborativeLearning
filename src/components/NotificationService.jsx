import { Notification } from "@/api/entities";
import { createPageUrl } from "@/utils";

export class NotificationService {
  static async createFileNotification(userEmail, type, fileTitle, fileId) {
    const notifications = {
      file_uploaded: {
        title: "קובץ הועלה בהצלחה",
        message: `הקובץ "${fileTitle}" הועלה למערכت וממתין לאישור מרצה.`
      },
      file_approved: {
        title: "קובץ אושר!",
        message: `הקובץ "${fileTitle}" אושר על ידי המרצה וזמין כעת לכלל הסטודנטים.`
      },
      file_rejected: {
        title: "קובץ נדחה",
        message: `הקובץ "${fileTitle}" נדחה על ידי המרצה. ניתן לערוך ולהעלות שוב.`
      }
    };

    const notificationData = notifications[type];
    if (!notificationData) return;

    try {
      await Notification.create({
        user_email: userEmail,
        type,
        title: notificationData.title,
        message: notificationData.message,
        related_item_id: fileId,
        action_url: createPageUrl("MyFiles"),
        is_read: false
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  static async createInquiryNotification(userEmail, inquirySubject, inquiryId) {
    try {
      await Notification.create({
        user_email: userEmail,
        type: "inquiry_responded",
        title: "התקבלה תשובה לפנייה",
        message: `התקבלה תשובה לפנייה שלך: "${inquirySubject}"`,
        related_item_id: inquiryId,
        action_url: createPageUrl("TrackInquiries"),
        is_read: false
      });
    } catch (error) {
      console.error("Error creating inquiry notification:", error);
    }
  }

  static async getRecentNotifications(userEmail, limit = 5) {
    try {
      return await Notification.filter({ user_email: userEmail }, '-created_date', limit);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  static async getUnreadCount(userEmail) {
    try {
      const notifications = await Notification.filter({ 
        user_email: userEmail, 
        is_read: false 
      });
      return notifications.length;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }
}