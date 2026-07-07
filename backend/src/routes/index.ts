import { Router } from 'express';
import { upload } from '../middlewares/multer';
import { handleUpload } from '../controllers/uploadController';
import { handleImport } from '../controllers/importController';

const router = Router();

router.post('/upload', upload.single('file'), handleUpload);
router.post('/import', handleImport);

export default router;
