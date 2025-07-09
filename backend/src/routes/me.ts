import { Router } from 'express';
import { getMe } from '../controllers/Users/meController';
import auth from '../middlewares/auth';

const router = Router();

router.get('/', auth, getMe);

export default router;
