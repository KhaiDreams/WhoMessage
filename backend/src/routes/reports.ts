import { Router } from 'express';
import * as ReportController from '../controllers/Reports/reportController';
import { AuthMiddleware } from '../middlewares/auth';

const router = Router();

// Rotas para usuários comuns (requer autenticação)
router.post('/reports', AuthMiddleware, ReportController.createReport);

// Rotas para administradores (requer autenticação + verificação de admin no controller)
router.get('/admin/reports', AuthMiddleware, ReportController.listReports);
router.get('/admin/reports/stats', AuthMiddleware, ReportController.getReportsStats);
router.put('/admin/reports/:id/status', AuthMiddleware, ReportController.updateReportStatus);
router.post('/admin/reports/:id/ban', AuthMiddleware, ReportController.banUserFromReport);
router.post('/admin/users/:userId/unban', AuthMiddleware, ReportController.unbanUser);

export default router;