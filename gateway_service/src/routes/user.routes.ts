import express from 'express';
import multer from 'multer';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser, updatePassword, sendActivationEmail, importUsers } from '@/controllers/user.controller';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// Import endpoint (must be before /user to avoid route conflicts)
router.post('/user/import', upload.single('file'), importUsers);

// CRUD and other endpoints
router.post('/user', createUser);
router.get('/users', getAllUsers);
router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.patch('/user/:id/password', updatePassword);
router.post('/user/:id/send-activation', sendActivationEmail);

export default router;