const MAX_SIDE = 1200;

// 写真を最大 1200px に縮めて canvas と ImageData にする。EXIF の向きは createImageBitmap が直す。
async function toPhoto(source) {
  const bmp = await createImageBitmap(source);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return { canvas, image: ctx.getImageData(0, 0, canvas.width, canvas.height) };
}

export const fileToPhoto = (file) => toPhoto(file);
export const blobToPhoto = (blob) => toPhoto(blob);

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}
