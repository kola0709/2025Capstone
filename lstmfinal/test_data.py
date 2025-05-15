import cv2
import numpy as np
import os

# 🔹 데이터 불러오기
action = "test5"  # 확인할 동작 라벨
data_path = os.path.join("dataset", action, "data.npy")

if not os.path.exists(data_path):
    print(f"❌ 데이터 파일이 없습니다: {data_path}")
    exit()

data = np.load(data_path, allow_pickle=True)
print(f"✅ 불러온 데이터 개수: {len(data)}")

# 🔹 랜덤으로 몇 개 확인하기
num_samples = min(20, len(data))  # 최대 5개 확인
samples = np.random.choice(len(data), num_samples, replace=False)

# 🔹 프레임 출력 함수
def show_sequence(sequence):
    for frame_num, keypoints in enumerate(sequence):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)  # 검은 화면 생성
        
        # 얼굴 (노랑)
        for i in range(0, 15, 3):
            x, y = int(keypoints[i] * 640), int(keypoints[i+1] * 480)
            cv2.circle(frame, (x, y), 5, (0, 255, 255), -1)

        # 왼손 (초록)
        for i in range(15, 78, 3):
            x, y = int(keypoints[i] * 640), int(keypoints[i+1] * 480)
            cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)

        # 오른손 (파랑)
        for i in range(78, 141, 3):
            x, y = int(keypoints[i] * 640), int(keypoints[i+1] * 480)
            cv2.circle(frame, (x, y), 5, (0, 0, 255), -1)

        # 어깨 (핑크)
        for i in range(141, 147, 3):
            x, y = int(keypoints[i] * 640), int(keypoints[i+1] * 480)
            cv2.circle(frame, (x, y), 5, (255, 0, 255), -1)

        cv2.putText(frame, f"Frame {frame_num+1}/30", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        cv2.imshow("Augmented Data", frame)
        if cv2.waitKey(30) & 0xFF == 27:  # ESC 키 누르면 종료
            return

# 🔹 랜덤 샘플 확인
for idx in samples:
    print(f"\n▶ 데이터 {idx+1}/{len(data)} 확인 중...")
    show_sequence(data[idx])

cv2.destroyAllWindows()
print("✅ 증강 데이터 확인 완료!")
