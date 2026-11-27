const {
  checkPermission
} = require("../../middlewares/admin/auth.middleware");
const router = require("express")
  .Router();
const dashboardController = require("../../controllers/admin/dashboard.controller");

router.get('/', checkPermission("dashboard-view"), dashboardController.dashboard)

router.post('/revenue-chart', checkPermission("dashboard-view"), dashboardController
  .revenueChartPost)

module.exports = router;
