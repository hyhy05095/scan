// 사진을 긴 변 maxSide px JPEG로 줄여 base64(접두어 없음)로 반환. 브라우저 전용.

const MAX_SIDE = 1024;
const QUALITY = 0.8;

async function loadImage(
  file: File,
): Promise<CanvasImageSource & { width: number; height: number }> {
  // createImageBitmap은 EXIF 회전을 반영해 디코딩 (대부분의 모바일 브라우저 지원)
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // 일부 형식(HEIC 등)은 아래 <img> 경로로 재시도
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function resizeToJpegBase64(file: File, maxSide = MAX_SIDE) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.drawImage(img, 0, 0, width, height);
  if ("close" in img && typeof img.close === "function") img.close();

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
