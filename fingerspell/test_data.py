import numpy as np
import cv2
import os
from time import sleep

# ---------------- 설정 ----------------
action = "ㄱ" # 확인하고 싶은 라벨 이름
dataset_path = "dataset"
data_path = os.path.join(dataset_path, action, "group_001.npy")

# ---------------- 데이터 로딩 ----------------
if not os.path.exists(data_path):
    print("❌ 데이터가 존재하지 않아요!")
    exit()

data = np.load(data_path, allow_pickle=True)
print(f"✅ '{action}' 라벨 데이터 로딩 완료! 총 시퀀스: {len(data)}개")

# ---------------- 시각화 함수 ----------------
def draw_hand(frame, keypoints, color=(255, 255, 255)):
    for i in range(21):
        x = int(keypoints[i * 3] * 640)
        y = int(keypoints[i * 3 + 1] * 480)
        cv2.circle(frame, (x, y), 4, color, -1)

# ---------------- 시퀀스 하나씩 확인 ----------------
for seq_idx, sequence in enumerate(data):
    print(f"\n🔍 시퀀스 {seq_idx+1} / {len(data)}")

    for frame in sequence:
        canvas = np.zeros((480, 640, 3), dtype=np.uint8)

        lh = frame[:63]
        rh = frame[63:]

        if not np.all(lh == 0):
            draw_hand(canvas, lh, (0, 255, 0))  # 왼손 초록
        if not np.all(rh == 0):
            draw_hand(canvas, rh, (0, 0, 255))  # 오른손 파랑

        cv2.imshow("데이터 확인", canvas)
        if cv2.waitKey(150) == 27:
            cv2.destroyAllWindows()
            exit()

    sleep(0.3)

cv2.destroyAllWindows()
