# lstmfinal/train_model.py

import os
import time
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.regularizers import l2
from sklearn.model_selection import train_test_split

def train_model():
    # 🔽 현재 파일 기준 절대 경로로 dataset 폴더 지정
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "dataset")

    print(f"[train_model.py] dataset_path = {dataset_path}")  # 경로 로그

    if not os.path.exists(dataset_path):
        print("[train_model.py] Dataset folder does not exist: " + dataset_path)
        return "Dataset not found"
    
    actions = os.listdir(dataset_path)  # 수집한 동작 리스트
    num_classes = len(actions)
    if num_classes == 0:
        print("[train_model.py] No action labels in the dataset folder.")
        return "No data"
    
    X, y = [], []
    for action_idx, action in enumerate(actions):
        action_path = os.path.join(dataset_path, action)
        data_file = os.path.join(action_path, "data.npy")
        if os.path.exists(data_file):
            data = np.load(data_file, allow_pickle=True)
            X.extend(data)
            y.extend([action_idx] * len(data))
        else:
            print(f"[train_model.py] Data file not found for action: '{action}'")
    
    X = np.array(X, dtype=np.float32)
    y = to_categorical(y, num_classes)  # 원-핫 인코딩

    if X.size == 0:
        print("[train_model.py] No data available.")
        return "No data"
    
    # 데이터 분할 (80% 학습, 20% 검증)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=True, random_state=42
    )
    
    # LSTM 모델 정의
    model = Sequential([
        LSTM(64, return_sequences=True, activation='relu',
             input_shape=(30, X.shape[2]), kernel_regularizer=l2(0.01)),
        Dropout(0.2),
        LSTM(64, return_sequences=False, activation='relu', kernel_regularizer=l2(0.01)),
        Dropout(0.2),
        Dense(32, activation='relu', kernel_regularizer=l2(0.01)),
        Dense(num_classes, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    # 모델 학습
    history = model.fit(X_train, y_train, epochs=25, batch_size=32, validation_data=(X_test, y_test))
    
    # 모델 저장
    model.save(os.path.join(base_dir, "sign_language_lstm.h5"))
    print("[train_model.py] Model saved: sign_language_lstm.h5")
    return "Training completed!"

if __name__ == "__main__":
    result = train_model()
    print("[train_model.py]", result)
