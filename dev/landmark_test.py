import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

# Download once: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
MODEL_PATH = "dev/pose_landmarker_lite.task"
IMAGE_PATH = "dev/fixtures/front2.png"
base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(base_options=base_options)
landmarker = vision.PoseLandmarker.create_from_options(options)

image = mp.Image.create_from_file(IMAGE_PATH)
img_w, img_h = image.width, image.height
print(f"image size: {img_w}x{img_h}")
result = landmarker.detect(image)
landmarks = result.pose_landmarks[0]  # first detected person
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24

for name, idx in [("left_shoulder", LEFT_SHOULDER), ("right_shoulder", RIGHT_SHOULDER),
                   ("left_hip", LEFT_HIP), ("right_hip", RIGHT_HIP)]:
    lm = landmarks[idx]
    print(f"{name}: x={lm.x:.3f}, y={lm.y:.3f}, visibility={lm.visibility:.3f}")

def to_px(lm, w, h):
    return lm.x * w, lm.y * h

left_shoulder_px = to_px(landmarks[LEFT_SHOULDER], img_w, img_h)
right_shoulder_px = to_px(landmarks[RIGHT_SHOULDER], img_w, img_h)
left_hip_px = to_px(landmarks[LEFT_HIP], img_w, img_h)
right_hip_px = to_px(landmarks[RIGHT_HIP], img_w, img_h)

def distance(p1, p2):
    return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5

shoulder_width = distance(left_shoulder_px, right_shoulder_px)
hip_width = distance(left_hip_px, right_hip_px)
shoulder_to_hip = shoulder_width / hip_width

print(f"shoulder_width (px): {shoulder_width:.1f}")
print(f"hip_width (px): {hip_width:.1f}")
print(f"shoulder_to_hip ratio: {shoulder_to_hip:.3f}")

# --- Segmentation for waist edge detection ---
seg_base_options = mp_python.BaseOptions(model_asset_path="dev/selfie_segmenter.tflite")
seg_options = vision.ImageSegmenterOptions(base_options=seg_base_options, output_category_mask=True)
segmenter = vision.ImageSegmenter.create_from_options(seg_options)

seg_result = segmenter.segment(image)
category_mask = seg_result.category_mask.numpy_view()  # 0 = background, 1 = person (typically)

print(f"mask shape: {category_mask.shape}, unique values: {set(category_mask.flatten().tolist())}")

# Save the mask as a visible black/white image so we can eyeball it
mask_visual = category_mask.astype("uint8")
cv2.imwrite("dev/fixtures/front1_mask.jpg", mask_visual)
print("saved mask to dev/fixtures/front1_mask.jpg")

# Person pixels are 0 in this mask (confirmed visually - background is white/255)
PERSON_VALUE = 0

shoulder_mid_y = (left_shoulder_px[1] + right_shoulder_px[1]) / 2
hip_mid_y = (left_hip_px[1] + right_hip_px[1]) / 2

# Waist sits ~65% of the way down from shoulders to hips
waist_y = int(shoulder_mid_y + 0.65 * (hip_mid_y - shoulder_mid_y))
print(f"waist_y estimated at: {waist_y}")

row = category_mask[waist_y, :]
center_x = int((left_shoulder_px[0] + right_shoulder_px[0]) / 2)  # approx torso center

# Walk outward from center until we hit background — stops at arm gaps
left_edge_x = center_x
while left_edge_x > 0 and row[left_edge_x] == PERSON_VALUE:
    left_edge_x -= 1
left_edge_x += 1  # step back onto the last person pixel

right_edge_x = center_x
while right_edge_x < len(row) - 1 and row[right_edge_x] == PERSON_VALUE:
    right_edge_x += 1
right_edge_x -= 1

if True:  # keep the rest of the block the same
    
    waist_width = right_edge_x - left_edge_x
    print(f"waist edges: left={left_edge_x}, right={right_edge_x}")
    print(f"waist_width (px): {waist_width}")

    shoulder_to_waist = shoulder_width / waist_width
    print(f"shoulder_to_waist ratio: {shoulder_to_waist:.3f}")
else:
    print("No person pixels found at that row — waist_y estimate may be off")

img_cv2 = cv2.imread(IMAGE_PATH)
cv2.line(img_cv2, (left_edge_x, waist_y), (right_edge_x, waist_y), (0, 255, 255), 6)
cv2.imwrite("dev/fixtures/front1_waist_check.jpg", img_cv2)
print("saved waist check to dev/fixtures/front1_waist_check.jpg")