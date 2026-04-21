export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function validateImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}": unsupported format. Use JPG, PNG, WEBP, or GIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)} — max is 5 MB.`;
  }
  return null;
}

export function fileToBase64DataUrl(file) {
  return new Promise((resolve, reject) => {
    const err = validateImageFile(file);
    if (err) return reject(new Error(err));

    const reader = new FileReader();
    reader.onload = () => {
      // We are now wrapping the raw Base64 string in a descriptive object
      resolve({
        kind: 'image',           // <-- NEW: Helps the UI distinguish from PDFs/Docs
        id: crypto.randomUUID(),  // Generates a unique ID for the chat state
        type: 'image',
        name: file.name,
        size: file.size,
        mediaType: file.type,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  }); 
}