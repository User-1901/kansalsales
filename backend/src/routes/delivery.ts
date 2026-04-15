import { Router } from 'express';
import { getValidDeliveryPincodes, getDeliveryPincodeSuggestions } from '../services/delivery.js';

const router = Router();

// ── GET /api/delivery/pincodes - Get all valid delivery pincodes ────────────
router.get('/pincodes', (req, res) => {
  try {
    const pincodes = getValidDeliveryPincodes();
    res.json({ pincodes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery pincodes' });
  }
});

// ── GET /api/delivery/suggestions - Get pincode suggestions ─────────────────
router.get('/suggestions', (req, res) => {
  try {
    const { query } = req.query as { query?: string };
    
    if (!query) {
      return res.json({ suggestions: [] });
    }

    const suggestions = getDeliveryPincodeSuggestions(query);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
