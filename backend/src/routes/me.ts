import { Router } from 'express';
import { getBootstrap, getMe, getMyProfileFull } from '../controllers/Users/meController';
import auth from '../middlewares/auth';

const router = Router();

router.get('/me', auth, getMe);
router.get('/bootstrap', auth, getBootstrap);
router.get('/me/full', auth, getMyProfileFull);

export default router;
