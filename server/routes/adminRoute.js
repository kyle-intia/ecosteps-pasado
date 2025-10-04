const express = require('express');
const AdminService = require('../services/adminService');

const router = express.Router();


/**
 * Admin Dashboard
 */
router.get("/dashboard/dailytrackings", async (req, res) => {
  try {
    const { page, limit, search, userId } = req.query;
    const result = await AdminService.listDailyTrackings({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      userId,
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list daily trackings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single daily tracking
router.get('/dashboard/dailytrackings/user/:userId', async (req, res) => {
  try {
    const tracking = await AdminService.getDailyTrackingByUserId(req.params.userId);
    if (!tracking) {
      return res.status(404).json({ error: 'Daily tracking not found for this user' });
    }
    res.json(tracking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Delete route
router.delete('/dashboard/dailytrackings/:id', async (req, res) => {
  try {
    const result = await AdminService.deleteDailyTracking(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update route
router.patch("/dashboard/dailytrackings/:id", async (req, res) => {
  try {
    const updated = await AdminService.patchDailyTracking(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Delete route
router.delete('/dashboard/dailytrackings/:id', async (req, res) => {
  try {
    const result = await AdminService.deleteDailyTracking(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Get daily footprint by category

router.get('/dashboard/emission/daily/:date', async (req, res) => {
  try {
    const data = await AdminService.getDailyFootprintByCategory(req.params.date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// get monthly footprint by category
router.get('/dashboard/emission/monthly/:month', async (req, res) => {
  try {
    const data = await AdminService.getMonthlyFootprintByCategory(req.params.month);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// get yearly footprint by category
router.get('/dashboard/emission/yearly/:year', async (req, res) => {
  try {
    const data = await AdminService.getYearlyFootprintByCategory(req.params.year);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



/**         MANAGE ACCOUNTS
 


 *   List users with filters, pagination
 */
router.get('/users', async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await AdminService.listUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      status,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single user
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await AdminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/users/admin', async (req, res) => {
  try {
    const admins = await AdminService.getUserAdmin();  // Fetch all admins
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admins', error: err.message });
  }
});

/**
 * Create user
 */
router.post('/users', async (req, res) => {
  try {
    const user = await AdminService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const user = await AdminService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    await AdminService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update user status
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const user = await AdminService.updateStatus(req.params.id, req.body.status);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Change user role
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const user = await AdminService.changeRole(req.params.id, req.body.role);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


/**
 * Gett all users
 */
router.get('/dashboard/user-growth', async (req, res) => {
  try {
    const stats = await AdminService.getUserGrowthStats();
    res.json(stats);
  } catch (err) {
    console.error("Error fetching user growth stats:", err);
    res.status(500).json({ error: 'Failed to fetch user growth stats' });
  }
});



router.get("/dashboard/activity-growth", async (req, res) => {
  try {
    const stats = await AdminService.getActivityLogGrowth();
    res.json(stats);
  } catch (error) {
    console.error("Failed to get activity log growth:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.get("/dashboard/avg-footprint-growth", async (req, res) => {
  try {
    const stats = await AdminService.getAvgFootprintGrowth();
    res.json(stats);
  } catch (error) {
    console.error("Failed to get avg footprint growth:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// footprint summary

router.get('/footprint/:entryId/breakdown', async (req, res) => {
  const { entryId } = req.params;

  try {
    const breakdown = await AdminService.getFootprintBreakdown(entryId);

    if (!breakdown) {
      return res.status(404).json({ error: 'Entry not found' });
    }
 
    res.json({ breakdown });
  } catch (error) {
    console.error('Error getting footprint breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/footprint/summary', async (req, res) => {
  try {
    const data = await AdminService.getMonthlySummaryAndEmissions();
    res.json(data);
  } catch (error) {
    console.error('Error fetching footprint summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/maintenance', async (req, res) => {
  try {
    const maintenanceMode = await AdminService.getMaintenanceMode();
    res.json({ maintenanceMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/maintenance', async (req, res) => {
  try {
    const { maintenanceMode } = req.body;
    const updatedStatus = await AdminService.setMaintenanceMode(maintenanceMode);
    res.json({ success: true, maintenanceMode: updatedStatus });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});




module.exports = router;
