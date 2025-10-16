import { Router } from 'express';
import * as ApiController from '../controllers/Users/userController';
import { AuthMiddleware } from '../middlewares/auth';
import { authLimiter, passwordChangeLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validation';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema, 
  updateUserSchema,
  addNicknamesSchema 
} from '../validators/userValidators';

const router = Router();

// Register - Login (com rate limiting e validação)
router.post('/auth/register', authLimiter, validateRequest(registerSchema), ApiController.registerUser);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), ApiController.loginUser);

// User management (requires authentication via token)
router.get('/users/:id', AuthMiddleware, ApiController.listUserbyId);
router.get('/users', AuthMiddleware, ApiController.listAllUsers);
router.put('/users/:id', AuthMiddleware, validateRequest(updateUserSchema), ApiController.updateUser);
router.post('/users/nicknames', AuthMiddleware, validateRequest(addNicknamesSchema), ApiController.addNicknames);
router.post('/users/change-password', passwordChangeLimiter, AuthMiddleware, validateRequest(changePasswordSchema), ApiController.changePassword);

// Admin routes
router.get('/admin/users', AuthMiddleware, ApiController.listUsersForAdmin);
router.put('/admin/users/:id/ban', AuthMiddleware, ApiController.toggleUserBan);

export default router;
