import express from "express";
import { getUser, loginUser, logoutsUser, registerUser, updateUser, userLoginStatus } from "../controllers/auth/user.controller.js";
import { adminMiddleware, creatorMiddleware, protect } from "../middleware/auth.middleware.js";
import { deleteUser, getAllUsers } from "../controllers/auth/admin.controller.js";


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutsUser);
router.get('/user', protect, getUser);
router.patch('/user', protect, updateUser);

// admin routes
router.delete('/admin/user/:id', protect, adminMiddleware, deleteUser);

// get all users
router.get('/users', protect, creatorMiddleware, getAllUsers);

// login status
router.get('/login-status', userLoginStatus);


export default router;