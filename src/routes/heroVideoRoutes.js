import { Router } from 'express';
import {
  getHeroVideos,
  getAllHeroVideos,
  createHeroVideo,
  updateHeroVideo,
  deleteHeroVideo,
} from '../controllers/heroVideoController.js';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { ROLES } from '../utils/constant.js';

const router = Router();

// Public
router.get('/', getHeroVideos);

// Admin
router.get('/all', requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getAllHeroVideos);
router.post('/', requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), createHeroVideo);
router.put('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), updateHeroVideo);
router.delete('/:id', requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteHeroVideo);

export default router;
