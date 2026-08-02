import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';

const router = Router();

router.get('/', profileController.getAll);
router.get('/:id', profileController.getById);
router.post('/', profileController.create);
router.put('/:id', profileController.update);
router.patch('/:id', profileController.patch);
router.delete('/:id', profileController.delete);

export default router;