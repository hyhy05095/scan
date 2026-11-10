import "server-only";

const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/gif": (bytes) =>
    matchesAscii(bytes, 0, "GIF87a") || matchesAscii(bytes, 0, "GIF89a"),
  "image/jpeg": (bytes) =>
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) =>
    matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": (bytes) =>
    matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WEBP"),
};

export async function hasValidImageSignature(file: File) {
  const matchesType = signatures[file.type];
  if (!matchesType) return false;

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return matchesType(bytes);
}

function matches(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function matchesAscii(bytes: Uint8Array, offset: number, value: string) {
  return [...value].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  );
}
