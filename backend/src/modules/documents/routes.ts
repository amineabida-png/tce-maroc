import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { deleteDocumentHandler, downloadDocumentHandler, listDocumentsHandler, uploadDocumentHandler } from './controller';

const router = Router();

// En mémoire (pas sur disque) : le fichier est aussitôt écrit en base
// (bytea) — cohérent avec l'absence de stockage objet configuré pour cette
// app. Limite à 10 Mo, largement suffisant pour des scans/photos de
// chantier ; à revoir si l'usage évolue vers de gros plans/vidéos.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', requireAuth, asyncHandler(listDocumentsHandler));
router.post('/', requireAuth, upload.single('fichier'), asyncHandler(uploadDocumentHandler));
router.get('/:id/telecharger', requireAuth, asyncHandler(downloadDocumentHandler));
router.delete('/:id', requireAuth, asyncHandler(deleteDocumentHandler));

export default router;
