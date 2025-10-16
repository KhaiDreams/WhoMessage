import { Router } from 'express';
import * as ApiController from '../controllers/Users/userController';
import { AuthMiddleware } from '../middlewares/auth';
import { authLimiter, passwordChangeLimiter } from '../middlewares/rateLimiter';
import { validateRequest, validateParams, validateQuery } from '../middlewares/validation';
import { requireAdmin, requireSelfOrAdmin } from '../middlewares/adminAuth';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema, 
  updateUserSchema,
  addNicknamesSchema 
} from '../validators/userValidators';
import { userIdSchema, adminUserBanSchema, adminSearchQuerySchema } from '../validators/commonValidators';

const router = Router();

// Register - Login (com rate limiting e validação)
router.post('/auth/register', authLimiter, validateRequest(registerSchema), ApiController.registerUser);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), ApiController.loginUser);

// User management (requires authentication via token)
router.get('/users/:id', AuthMiddleware, validateParams(userIdSchema), ApiController.listUserbyId);
router.put('/users/:id', AuthMiddleware, requireSelfOrAdmin, validateParams(userIdSchema), validateRequest(updateUserSchema), ApiController.updateUser);
router.post('/users/nicknames', AuthMiddleware, validateRequest(addNicknamesSchema), ApiController.addNicknames);
router.post('/users/change-password', passwordChangeLimiter, AuthMiddleware, validateRequest(changePasswordSchema), ApiController.changePassword);

// Admin routes (com validação de admin)
router.get('/admin/users', AuthMiddleware, requireAdmin, validateQuery(adminSearchQuerySchema), ApiController.listUsersForAdmin);
router.put('/admin/users/:id/ban', AuthMiddleware, requireAdmin, validateParams(userIdSchema), validateRequest(adminUserBanSchema), ApiController.toggleUserBan);

export default router;
