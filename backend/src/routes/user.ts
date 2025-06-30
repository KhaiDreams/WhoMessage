import { Router } from 'express';
import * as ApiController from '../controllers/Users/userController';
import { AuthMiddleware } from '../middlewares/auth';

const router = Router();

// Register - Login
router.post('/auth/register', ApiController.registerUser);
router.post('/auth/login', ApiController.loginUser);

// User management (requires authentication via token)
router.get('/users/:id', AuthMiddleware, ApiController.listUserbyId);
router.get('/users', AuthMiddleware, ApiController.listAllUsers);
router.put('/users/:id', AuthMiddleware, ApiController.updateUser);
router.post('/users/nicknames', AuthMiddleware, ApiController.addNicknames);

export default router;
