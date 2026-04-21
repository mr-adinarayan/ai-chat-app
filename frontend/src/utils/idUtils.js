export function generateId() {
  return window.crypto.randomUUID();
}

export function maskKey(plain) {
  if (!plain || plain.length < 8) return '';
  return `••••••••${plain.slice(-4)}`;
}