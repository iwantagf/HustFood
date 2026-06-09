export const DEFAULT_PRODUCT_IMAGE = '/images/burger.png';

const DATA_IMAGE_PATTERN = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-z0-9+/=\s]+$/i;

export function isLocalFilesystemImagePath(value) {
  const image = String(value || '').trim();
  if (!image) return false;

  return (
    image.startsWith('file://')
    || image.startsWith('/home/')
    || image.startsWith('/Users/')
    || image.startsWith('/Downloads/')
    || image.startsWith('~/')
    || /^[a-z]:[\\/]/i.test(image)
  );
}

export function isSupportedImageSource(value) {
  const image = String(value || '').trim();
  if (!image) return false;

  return (
    image.startsWith('/images/')
    || image.startsWith('/uploads/')
    || image.startsWith('http://')
    || image.startsWith('https://')
    || DATA_IMAGE_PATTERN.test(image)
  );
}

export function normalizeImageSource(value, fallback = DEFAULT_PRODUCT_IMAGE) {
  const image = String(value || '').trim();
  if (!image || isLocalFilesystemImagePath(image) || !isSupportedImageSource(image)) {
    return fallback;
  }

  return image;
}

export function validateImageSource(value) {
  const image = String(value || '').trim();
  if (!image) return { image: DEFAULT_PRODUCT_IMAGE };

  if (isLocalFilesystemImagePath(image)) {
    return { error: 'Ảnh phải được upload qua form hoặc dùng URL public, không dùng đường dẫn file trên máy.' };
  }

  if (!isSupportedImageSource(image)) {
    return { error: 'Ảnh phải là URL public, /images/..., /uploads/... hoặc file được upload qua form.' };
  }

  return { image };
}
