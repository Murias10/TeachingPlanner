import { Router } from 'express';
import multer from 'multer';
import { UserController } from '@/controllers/user.controller';
import { validateCreateUser, validateUpdateUser } from '@/middleware/validation.middleware';

const router = Router();
const userController = new UserController();

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only Excel files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// CRUD Operations
router.post('/user', validateCreateUser, userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/user/:id', userController.getUserById);
router.put('/user/:id', validateUpdateUser, userController.updateUser);
router.delete('/user/:id', userController.deleteUser);

// Additional endpoints
router.get('/user/role/:role', userController.getUsersByRole);
router.get('/users/search', userController.searchUsers);
router.patch('/user/:id/password', userController.updatePassword);

// Import endpoints
router.post('/user/import/preview', upload.single('file'), userController.previewImport);
router.post('/user/import', upload.single('file'), userController.importUsers);

export default router;