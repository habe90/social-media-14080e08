// SELAMY - CLIENT-SIDE CANVAS COMPRESSION & MEDIA OPTIMIZATION UTILS

/**
 * Compress an Image File using HTML5 Canvas
 * Reduces file size by 80%-95% before saving to storage
 */
export function compressImageFile(file, maxWidth = 1080, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        const origKB = Math.round(file.size / 1024);
        const compKB = Math.round((dataUrl.length * 3 / 4) / 1024);
        const savings = Math.max(0, Math.round((1 - compKB / origKB) * 100));

        resolve({
          dataUrl,
          origKB,
          compKB,
          savings
        });
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Display toast message
 */
export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
