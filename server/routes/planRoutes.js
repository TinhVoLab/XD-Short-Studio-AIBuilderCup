import { Router } from 'express';
import { planService } from '../services/planService.js';

const router = Router();

/**
 * Public Endpoint: Get active plans for Landing Page & Pricing Modal
 * Cached in RAM on server, responses cached for 5 minutes in client browser
 */
router.get('/', async (req, res) => {
  try {
    const plans = await planService.getPublicPlans();
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min browser cache
    res.json(plans);
  } catch (err) {
    console.error('Error fetching public plans:', err);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

export default router;
