import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middlewares/auth.js'; // fixed plural 's'

const router = Router();

// 1. GET: Fetch latest 50 notifications for logged-in user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id, isRead: false })
      .sort({ createdAt: -1 })
      .limit(50);
      
    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// 2. PATCH: Mark single notification as read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// 3. PATCH: Mark all notifications as read for logged-in user
router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
