import fs from 'fs/promises';
import path from 'path';

/**
 * Атомарний запис: спочатку у .tmp, потім fs.rename()
 * Враховані виняткові ситуації:
 *  - директорія не існує → fs.mkdir з recursive:true
 *  - помилка запису → видаляємо .tmp (ENOENT ігнорується — tmp не встиг створитись)
 *  - помилка cleanup → логуємо, але не глушимо оригінальну помилку
 */
export const writeAtomic = async (filePath, data) => {
  const tmp = `${filePath}.tmp`;
  const dir = path.dirname(filePath);

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  } catch (error) {
    try {
      await fs.unlink(tmp);
    } catch (unlinkError) {
      if (unlinkError.code !== 'ENOENT') {
        console.error('Failed to cleanup tmp file:', unlinkError);
      }
    }
    throw error;
  }
};

/**
 * Формує повний URL зображення з відносного шляху
 * Виносимо в utils щоб не дублювати в контролерах
 */
export const buildImageUrl = (request, relativePath) => {
  if (!relativePath) return null;
  return `${request.protocol}://${request.hostname}/uploads${relativePath}`;
};
