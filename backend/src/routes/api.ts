import { Router } from 'express';
import * as ApiController from '../controllers/Users/userController';
import { AuthMiddleware } from '../middlewares/auth';
import cors from 'cors';

const router = Router();

router.get('/health-check', (req, res) => {
    res.json({"health-check": true})
});

// Register - Login
router.post('/auth/register', ApiController.registerUser);
router.post('/auth/login', ApiController.loginUser);

// User management (requires authentication via token)
router.get('/users/:id', AuthMiddleware, ApiController.listUserbyId);
router.get('/users', AuthMiddleware, ApiController.listAllUsers);
router.put('/users/:id', AuthMiddleware, ApiController.updateUser);
router.delete('/users/:id', AuthMiddleware, ApiController.deleteUser);

export default router;
