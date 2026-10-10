// Turns a camera frame or an uploaded file into a canvas. The canvas stays in
// memory on this device and is what the measuring step reads (ADR-002).

/** Copies the current video frame, unmirrored, at the camera's full resolution. */
export function frameToCanvas(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  return canvas
}

/** Decodes an image file (respecting its rotation tag). Throws if it isn't an image. */
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}
