import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();


router.get('/', requireAuth, (req, res) => {
  res.json(req.user); // { id, email, role }
});

export default router;

/*
The frontend calls this after login
to learn who the user is and whether they are an admin.
 */