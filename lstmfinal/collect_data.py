import cv2
import mediapipe as mp
import numpy as np
import os
import time
import random
from scipy.interpolate import CubicSpline
from scipy.interpolate import interp1d

# 🔹 Mediapipe 설정
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=False, model_complexity=1)

# 🔹 키포인트 추출 및 표시 함수
def extract_keypoints(results, frame):
    image_height, image_width, _ = frame.shape

    def get_landmarks(landmarks, indices, color):
        keypoints = []
        if landmarks:
            for idx in indices:
                lm = landmarks.landmark[idx]
                cx, cy = int(lm.x * image_width), int(lm.y * image_height)
                keypoints.append([lm.x, lm.y, lm.z])
                cv2.circle(frame, (cx, cy), 5, color, -1)  # 키포인트 표시
        else:
            keypoints = [[0, 0, 0] for _ in indices]
        return np.array(keypoints).flatten()

    face_indices = [1, 33, 263, 61, 291]  # 얼굴 5점
    pose_indices = [11, 12]              # 어깨 2점
    hand_indices = range(21)             # 손 21점

    face = get_landmarks(results.face_landmarks, face_indices, (255, 255, 0))   # 노랑
    lh = get_landmarks(results.left_hand_landmarks, hand_indices, (0, 255, 0))  # 초록
    rh = get_landmarks(results.right_hand_landmarks, hand_indices, (0, 0, 255)) # 파랑
    pose = get_landmarks(results.pose_landmarks, pose_indices, (255, 0, 255))   # 핑크

    return np.concatenate([face, lh, rh, pose])

# 🔹 (0,0,0) 보간 함수
# 🔹 (0,0,0) 보간 함수 (Cubic Spline 적용)
def interpolate_missing_keypoints(sequence):
    sequence = np.array(sequence)
    num_frames, num_keypoints = sequence.shape
    
    for kp_idx in range(0, num_keypoints, 3):
        coords = sequence[:, kp_idx:kp_idx+3]
        valid_idx = np.where(~np.all(coords == 0, axis=1))[0]
        if len(valid_idx) < 2:
            continue  # 유효한 프레임 2개 이상 없으면 보간 불가

        for dim in range(3):  # x, y, z 각각 보간
            try:
                spline = CubicSpline(valid_idx, coords[valid_idx, dim], extrapolate=True)
                coords[:, dim] = spline(np.arange(num_frames))
            except:
                pass  # 예외 발생 시 그냥 넘어감
        
        sequence[:, kp_idx:kp_idx+3] = coords
    return sequence
# 🔹 유효성 검사
def is_valid_sequence(sequence, threshold=0.5):
    if sequence.shape != (30, 147):
        return False
    zero_ratio = np.sum(sequence == 0) / sequence.size
    return zero_ratio < threshold

# 🔹 데이터 저장 함수
def save_data(action, sequence):
    dataset_path = "dataset"
    action_path = os.path.join(dataset_path, action)
    os.makedirs(action_path, exist_ok=True)
    data_file = os.path.join(action_path, "data.npy")

    if os.path.exists(data_file):
        data = np.load(data_file, allow_pickle=True).tolist()
    else:
        data = []

    data.append(sequence)
    np.save(data_file, np.array(data))
    print(f"✅ '{action}' 저장 완료! 현재 개수: {len(data)}")

# 🔹 데이터 증강 함수
# 🔹 데이터 증강 함수
def augment_sequence(sequence, num_augments=1000):
    sequence = interpolate_missing_keypoints(sequence)
    
    if not is_valid_sequence(sequence):
        return []

    augmented_sequences = []
    
    for _ in range(num_augments):
        aug_seq = sequence.copy()

        # 🔹 시퀀스 전체 이동 (좌우, 위아래)
        shift_x = np.random.uniform(-0.05, 0.05)  # X축 이동
        shift_y = np.random.uniform(-0.05, 0.05)  # Y축 이동
        aug_seq[:, 0::3] += shift_x
        aug_seq[:, 1::3] += shift_y

        # 🔹 손 크기 조절
        hand_scale = np.random.uniform(0.8, 1.2)
        aug_seq[:, 21*3:63] *= hand_scale  # 손 키포인트 확대/축소

        # 🔹 거리 조절 (양손, 어깨, 얼굴 사이 거리 변경)
        distance_factor = np.random.uniform(0.9, 1.1)
        aug_seq[:, :] *= distance_factor

        # 🔹 프레임 일부 삭제 후 보간 (움직임 자연스럽게)
        keep_ratio = np.random.uniform(0.8, 1.0)  # 80~100% 프레임 유지
        num_keep = int(30 * keep_ratio)
        keep_indices = sorted(np.random.choice(30, num_keep, replace=False))
        resampled_seq = aug_seq[keep_indices]

        # 🔹 길이 변형 (속도 변화 효과)
        stretch_factor = np.random.uniform(0.9, 1.1)  # 90~110% 속도로 조정
        new_length = max(2, int(30 * stretch_factor))
        x_old = np.linspace(0, 1, num_keep)
        x_new = np.linspace(0, 1, new_length)
        f_interp = interp1d(x_old, resampled_seq, axis=0, kind='linear', fill_value='extrapolate')
        stretched_seq = f_interp(x_new)

        # 🔹 30프레임으로 패딩 or 잘라내기
        if len(stretched_seq) < 30:
            pad_size = 30 - len(stretched_seq)
            stretched_seq = np.pad(stretched_seq, ((0, pad_size), (0, 0)), mode='edge')
        else:
            stretched_seq = stretched_seq[:30]

        augmented_sequences.append(stretched_seq)

    return augmented_sequences

# 🔹 웹캠 실행
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ 웹캠을 열 수 없습니다.")
    exit()

while True:
    action = input("\n수집할 동작 라벨 입력 ('exit' 입력 시 종료): ").strip()
    if action.lower() == 'exit':
        break

    print(f"\n'{action}' 수집 준비 완료! 웹캠 보고 **엔터(Enter)** 누르세요.")

    # 준비 대기 화면
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ 웹캠 오류.")
            break
        frame = cv2.flip(frame, 1)
        cv2.putText(frame, "준비되면 ENTER!", (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        cv2.imshow("Webcam", frame)

        if cv2.waitKey(1) == 13:  # Enter 키
            break
        elif cv2.waitKey(1) == 27:  # ESC 키
            cap.release()
            cv2.destroyAllWindows()
            exit()

    print(f"\n⏳ 3초 후 '{action}' 수집 시작...")
    time.sleep(3)

    sequence = []
    for frame_num in range(30):
        ret, frame = cap.read()
        if not ret:
            print("❌ 프레임 오류.")
            break
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(rgb_frame)
        keypoints = extract_keypoints(results, frame)
        sequence.append(keypoints)

        cv2.putText(frame, f"{action} ({frame_num + 1}/30)", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Webcam", frame)

        if cv2.waitKey(1) == 27:  # ESC 키
            cap.release()
            cv2.destroyAllWindows()
            exit()

    sequence = np.array(sequence)
    

    if is_valid_sequence(sequence):
        save_data(action, sequence)
        print(f"\n🔄 '{action}' 증강 중...")
        augmented_data = augment_sequence(sequence, num_augments=300)
        for aug in augmented_data:
            save_data(action, aug)
        print(f"🚀 '{action}' 증강 완료!")
    else:
        print("❌ 데이터 유효하지 않음. 저장 안 함.")

cap.release()
cv2.destroyAllWindows()
print("✅ 전체 수집 종료!")
