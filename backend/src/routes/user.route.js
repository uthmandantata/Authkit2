import express from "express";
import { getUser, loginUser, logoutsUser, registerUser, updateUser } from "../controllers/auth/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutsUser);
router.get('/user', protect, getUser);
router.post('/update-user', protect, updateUser);

export default router;