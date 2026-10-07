// MediaPipe model wrappers. Browser only: these need WASM and WebGL, so they
// are exercised in the app, not in unit tests. The maths lives in maths.ts.
import { FilesetResolver, ImageSegmenter, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "./maths";

/** Where the WASM runtime and model files are served from (self-hosted, see ADR-002). */
export interface ModelPaths {
  wasmBase: string;
  poseModel: string;
  segmenterModel: string;
}

export interface Models {
  pose: PoseLandmarker;
  segmenter: ImageSegmenter;
}

/** Image plus everything the maths needs from the two models. */
export interface Detection {
  width: number;
  height: number;
  /** Landmarks of the first person found, or null if nobody was detected. */
  landmarks: Landmark[] | null;
  /** Row y of the segmentation mask. */
  maskRowAt: (y: number) => Uint8Array;
}

/**
 * Category value of person pixels in the selfie segmenter's mask.
 * The prototype found person = 0 (background is non-zero); confirm on a
 * real photo in the browser before relying on it.
 */
export const PERSON_VALUE = 0;

export async function loadModels(paths: ModelPaths): Promise<Models> {
  const fileset = await FilesetResolver.forVisionTasks(paths.wasmBase);
  const [pose, segmenter] = await Promise.all([
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: paths.poseModel },
      runningMode: "IMAGE",
      numPoses: 1,
    }),
    ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: paths.segmenterModel },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    }),
  ]);
  return { pose, segmenter };
}

type ImageInput = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export function detect(models: Models, image: ImageInput): Detection {
  const width = image.width;
  const height = image.height;

  const poseResult = models.pose.detect(image);
  const landmarks = poseResult.landmarks[0] ?? null;

  const segResult = models.segmenter.segment(image);
  const mask = segResult.categoryMask;
  if (!mask) throw new Error("Segmenter returned no category mask");
  // Copy before close(): the mask's memory belongs to MediaPipe.
  const maskData = mask.getAsUint8Array().slice();
  const maskWidth = mask.width;
  segResult.close();

  return {
    width,
    height,
    landmarks,
    maskRowAt: (y) => maskData.subarray(y * maskWidth, (y + 1) * maskWidth),
  };
}
