import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { User } from '../../models/Users/User';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'));
    }
  }
});

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const userId = req.userId;
    const AVATAR_PUBLIC_ID = `avatars/user_${userId}`;

    // Apaga a imagem antiga do bucket antes de enviar a nova.
    // Usa o public_id fixo por usuário — se não existir, o Cloudinary ignora silenciosamente.
    try {
      await cloudinary.uploader.destroy(AVATAR_PUBLIC_ID, { invalidate: true });
    } catch {
      // Falha ao deletar não deve bloquear o upload
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: AVATAR_PUBLIC_ID,
          overwrite: true,
          invalidate: true,
          use_filename: false,
          unique_filename: false,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload falhou'));
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(req.file!.buffer);
    });

    // Atualiza o pfp no banco de dados automaticamente
    await User.update({ pfp: result.secure_url }, { where: { id: userId } });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Erro ao fazer upload da imagem.' });
  }
};
