const AdminService = require('../services/adminService');

async function checkMaintenance(req, res, next) {
  try {
    const isMaintenance = await AdminService.getMaintenanceMode();
    if (isMaintenance) {
      return res.status(503).json({ message: 'System is under maintenance. Please try again later.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkMaintenance;
