import os
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# 🔹 벡터 기반 3D 특성 추출
def extract_vector_features_3d(joint):
    joint_3d = joint[:, :3]
    v1 = joint_3d[[0,1,2,3,0,5,6,7,0,9,10,11,0,13,14,15,0,17,18,19]]
    v2 = joint_3d[[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]]
    v = v2 - v1
    v = v / (np.linalg.norm(v, axis=1, keepdims=True) + 1e-6)

    angle_idx1 = [0,1,2,4,5,6,8,9,10,12,13,14,16,17,18]
    angle_idx2 = [1,2,3,5,6,7,9,10,11,13,14,15,17,18,19]
    angles = [np.degrees(np.arccos(np.clip(np.dot(v[i], v[j]), -1.0, 1.0))) for i, j in zip(angle_idx1, angle_idx2)]

    base = [5, 9, 13, 17]
    inter_angles = []
    for i in range(len(base)-1):
        vi = joint_3d[base[i+1]] - joint_3d[base[i]]
        vj = joint_3d[base[i]] - joint_3d[0]
        vi /= (np.linalg.norm(vi) + 1e-6)
        vj /= (np.linalg.norm(vj) + 1e-6)
        inter_angles.append(np.degrees(np.arccos(np.clip(np.dot(vi, vj), -1.0, 1.0))))

    return np.concatenate([v.flatten(), np.array(angles), np.array(inter_angles)])

# 🔹 데이터 로딩
def load_vector_feature_data_3d(dataset_path="dataset"):
    X, y = [], []
    for label in os.listdir(dataset_path):
        label_path = os.path.join(dataset_path, label)
        if not os.path.isdir(label_path): continue
        for file in os.listdir(label_path):
            if file.endswith(".npy") and file.startswith("group_"):
                data = np.load(os.path.join(label_path, file), allow_pickle=True)
                for sequence in data:
                    features = np.array([
                        extract_vector_features_3d(frame.reshape(42, 3)) for frame in sequence
                    ])
                    X.append(features)
                    y.append(label)
    return np.array(X), np.array(y)

# 🔹 학습 코드
if __name__ == "__main__":
    X, y = load_vector_feature_data_3d()
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    y_onehot = to_categorical(y_encoded)
    joblib.dump(le, "label_encoder.pkl")

    X_train, X_val, y_train, y_val = train_test_split(X, y_onehot, test_size=0.2, random_state=42)
    feature_dim = X.shape[2]
    num_classes = y_onehot.shape[1]

    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=(10, feature_dim)),
        Dropout(0.3),
        LSTM(64),
        Dropout(0.3),
        Dense(64, activation='relu'),
        Dense(num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.summary()

    model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=20, batch_size=32)
    model.save("fingerspelling_vector3d_lstm.h5")
