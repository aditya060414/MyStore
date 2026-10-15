import AuditLog from '../models/AuditLog.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Sale from '../models/Sale.js';

// @desc    Get audit history and activity stream
// @route   GET /api/v1/history
export const getHistory = async (req, res) => {
  try {
    const { action, search, page = 1, limit = 30 } = req.query;
    const query = { tenantId: req.tenantId };

    if (action && action !== 'All') {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // Also fetch recent inventory movements for quick tab switching
    const movements = await InventoryMovement.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        logs,
        movements,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
