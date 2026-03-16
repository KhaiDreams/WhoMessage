import { Router } from 'express';
import * as ReportController from '../controllers/Reports/reportController';
import { AuthMiddleware } from '../middlewares/auth';
import { reportLimiter } from '../middlewares/rateLimiter';
import { validateRequest, validateParams, validateQuery } from '../middlewares/validation';
import { requireAdmin } from '../middlewares/adminAuth';
import { reportSchema, userIdSchema, listReportsQuerySchema, reportIdSchema } from '../validators/commonValidators';

const router = Router();

// Rotas para usuários comuns (com rate limiting e validação)
router.post('/reports', reportLimiter, AuthMiddleware, validateRequest(reportSchema), ReportController.createReport);

// Rotas para administradores (com validação de admin)
router.get('/admin/reports', AuthMiddleware, requireAdmin, validateQuery(listReportsQuerySchema), ReportController.listReports);
router.get('/admin/reports/stats', AuthMiddleware, requireAdmin, ReportController.getReportsStats);
router.put('/admin/reports/:id/status', AuthMiddleware, requireAdmin, validateParams(reportIdSchema), ReportController.updateReportStatus);
router.post('/admin/reports/:id/ban', AuthMiddleware, requireAdmin, validateParams(reportIdSchema), ReportController.banUserFromReport);
router.post('/admin/users/:userId/unban', AuthMiddleware, requireAdmin, validateParams(userIdSchema), ReportController.unbanUser);

export default router;
