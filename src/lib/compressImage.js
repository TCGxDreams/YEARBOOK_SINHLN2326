// Nén + resize ảnh trước khi upload
export async function compressImage(file, { maxDim = 1600, quality = 0.8 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file; // bỏ qua video/gif

  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl;
  });

  let { width, height } = img;
  if (width <= maxDim && height <= maxDim && file.size < 600 * 1024) return file; // đã đủ nhỏ
  if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
  else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }

  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}
