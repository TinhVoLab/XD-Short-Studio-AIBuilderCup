import { Router } from 'express';
import systemRoutes from './ai/systemRoutes.js';
import contentRoutes from './ai/contentRoutes.js';
import sceneDesignRoutes from './ai/sceneDesignRoutes.js';
import ttsRoutes from './ai/ttsRoutes.js';
import mediaIngestRoutes from './ai/mediaIngestRoutes.js';
import diagramRoutes from './ai/diagramRoutes.js';
import sceneSlotRoutes from './ai/sceneSlotRoutes.js';
import masterPlanRoutes from './ai/masterPlanRoutes.js';

const router = Router();

// ── AI Domain Sub-Routers ──
router.use('/', systemRoutes);
router.use('/', contentRoutes);
router.use('/', sceneDesignRoutes);
router.use('/', sceneSlotRoutes);
router.use('/', masterPlanRoutes);
router.use('/', ttsRoutes);
router.use('/', mediaIngestRoutes);
router.use('/', diagramRoutes);

export default router;
