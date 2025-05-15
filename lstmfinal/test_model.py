import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from collections import deque
from PIL import ImageFont, ImageDraw, Image
import time

# ✅ 예측할 단어 목록
actions = np.array(["감사","네모","동그라미", "만나다", "많이","세모", "안녕하세요", "즐기다","테스트2","헤어지다", "bump-yo", "점프3"])  

# Mediapipe 설정
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=False, model_complexity=1)

# LSTM 모델 로드
model = tf.keras.models.load_model("sign_language_lstm.h5")

# 🔹 키포인트 추출 함수
def extract_keypoints(results):
    def get_landmarks(landmarks, indices):
        if landmarks:
            keypoints = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark])
            return keypoints[indices].flatten()
        return np.zeros(len(indices) * 3)

    face_indices = [1, 33, 263, 61, 291]
    pose_indices = [11, 12]  
    hand_indices = range(21)  

    face = get_landmarks(results.face_landmarks, face_indices)
    lh = get_landmarks(results.left_hand_landmarks, hand_indices)
    rh = get_landmarks(results.right_hand_landmarks, hand_indices)
    pose = get_landmarks(results.pose_landmarks, pose_indices)

    return np.concatenate([face, lh, rh, pose])  

# 🔹 프레임 버퍼 (최근 30개 저장)
sequence = deque(maxlen=30)

# 한글 폰트 설정
font_path = "malgun.ttf"
font = ImageFont.truetype(font_path, 25)

# 한글 출력 함수
def put_text_korean(image, text, position, font, color=(0, 255, 0)):
    image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(image_pil)
    draw.text(position, text, font=font, fill=color)
    return cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)

# 웹캠 실행
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ 웹캠을 열 수 없습니다.")
    exit()

# 상태 변수
waiting_for_keypress = True  # 엔터 입력 대기 상태
start_time = None  # 키포인트 추출 시작 시간
prediction_result = None  # 예측 결과 저장
show_result_time = None  # 예측 결과 표시 시작 시간

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ 웹캠에서 프레임을 가져올 수 없습니다.")
        break

    frame = cv2.flip(frame, 1)

    if waiting_for_keypress:
        # 🔹 엔터키를 기다리는 상태
        if show_result_time and (time.time() - show_result_time < 3):
            # 예측 결과가 나온 후 3초 동안 유지
            frame = put_text_korean(frame, prediction_result, (50, 50), font, (0, 255, 0))
        else:
            # 3초가 지나면 다시 엔터 대기 메시지 표시
            prediction_result = None
            frame = put_text_korean(frame, "🔵 수어 번역을 하려면 엔터를 누르세요!", (100, 200), font, (255, 0, 0))
    
    else:
        elapsed_time = time.time() - start_time

        if elapsed_time < 2:
            # 🔹 2초 대기 중
            frame = put_text_korean(frame, "🟡 2초 뒤에 추출이 시작됩니다!", (150, 50), font, (0, 255, 255))
        
        else:
            # 🔹 키포인트 추출 시작!
            if len(sequence) == 0:
                frame = put_text_korean(frame, "🟢 키포인트 추출 시작!", (150, 50), font, (0, 255, 0))

            # Mediapipe로 키포인트 추출
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = holistic.process(rgb_frame)
            keypoints = extract_keypoints(results)
            sequence.append(keypoints)

            # 🔹 현재 프레임 개수 표시
            frame = put_text_korean(frame, f"🟡 키포인트 추출 중... {len(sequence)}/30", (50, 400), font, (255, 255, 0))

            # 30프레임을 모으면 예측 수행
            if len(sequence) == 30: 
                input_data = np.expand_dims(sequence, axis=0)  # (1, 30, 147)
                prediction = model.predict(input_data)
                confidence = np.max(prediction)
                action_index = np.argmax(prediction, axis=1)[0]  

                # 🔹 예측 결과 저장
                
                prediction_result = f"✅ 예측 완료! 결과: {actions[action_index]} ({confidence:.2f})"
               

                show_result_time = time.time()  # 결과 표시 시작 시간 저장

                # 🔹 다시 엔터키를 기다리는 상태로 변경
                waiting_for_keypress = True
                sequence.clear()  

    # 웹캠 출력
    cv2.imshow("Webcam - Real-time Prediction", frame)

    # 엔터키를 누르면 2초 후 예측 시작
    key = cv2.waitKey(1) & 0xFF
    if key == 13:  # 엔터키 (13번)
        if waiting_for_keypress:
            waiting_for_keypress = False  # 예측 시작 모드로 변경
            start_time = time.time()  # 2초 대기 시작
    
    # ESC로 종료
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
