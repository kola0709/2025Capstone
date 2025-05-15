# HSwebFile/lstmfinal/flask_app.py

import os
import time
import random

from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from scipy.interpolate import CubicSpline, interp1d

app = Flask(__name__)

# ── 동적으로 라벨 로드 ─────────────────────────────────────────────────────────
DATASET_DIR = 'dataset'

def load_actions():
    """dataset 폴더 하위 디렉토리명을 라벨로 읽어들여 정렬 후 numpy 배열로 반환"""
    if not os.path.isdir(DATASET_DIR):
        print(f"Warning: '{DATASET_DIR}' 디렉토리가 없습니다.")
        return np.array([])
    names = [d for d in os.listdir(DATASET_DIR)
             if os.path.isdir(os.path.join(DATASET_DIR, d))]
    names.sort()
    return np.array(names)

actions = load_actions()
print(f"Loaded actions: {actions}")

# ── 모델 로드 ────────────────────────────────────────────────────────────────────
MODEL_PATH = 'sign_language_lstm.h5'
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"모델 파일이 없습니다: {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)

# ── 공통 유틸 함수들 ──────────────────────────────────────────────────────────

def is_valid_sequence(sequence, threshold=0.5):
    """30×147 shape 확인 및 0 비율 검사"""
    if sequence.shape != (30, 147):
        return False
    zero_ratio = np.sum(sequence == 0) / sequence.size
    return zero_ratio < threshold


def interpolate_missing_keypoints(sequence):
    """(0,0,0) 보간 (Cubic Spline)"""
    sequence = np.array(sequence)
    num_frames, num_kp = sequence.shape
    for kp_idx in range(0, num_kp, 3):
        coords = sequence[:, kp_idx:kp_idx+3]
        valid = np.where(~np.all(coords == 0, axis=1))[0]
        if len(valid) < 2:
            continue
        for dim in range(3):
            try:
                spline = CubicSpline(valid, coords[valid, dim], extrapolate=True)
                coords[:, dim] = spline(np.arange(num_frames))
            except Exception:
                pass
        sequence[:, kp_idx:kp_idx+3] = coords
    return sequence


def augment_sequence(sequence, num_augments=300):
    """시프트, 스케일, 거리변형, 프레임 드롭+보간, 속도변형"""
    seq = interpolate_missing_keypoints(sequence)
    if not is_valid_sequence(seq):
        return []
    out = []
    for _ in range(num_augments):
        aug = seq.copy()
        # 1) 시프트
        sx, sy = np.random.uniform(-0.05, 0.05, 2)
        aug[:, 0::3] += sx
        aug[:, 1::3] += sy
        # 2) 손 스케일 영역 (21*3~63)
        hs = np.random.uniform(0.8, 1.2)
        aug[:, 21*3:63] *= hs
        # 3) 전체 거리 조정
        df = np.random.uniform(0.9, 1.1)
        aug *= df
        # 4) 프레임 드롭 & 보간
        kr = np.random.uniform(0.8, 1.0)
        nk = int(30 * kr)
        idx = sorted(np.random.choice(30, nk, replace=False))
        res = aug[idx]
        # 5) 속도 변형
        sf = np.random.uniform(0.9, 1.1)
        nl = max(2, int(30 * sf))
        x_old = np.linspace(0, 1, nk)
        x_new = np.linspace(0, 1, nl)
        f = interp1d(x_old, res, axis=0, kind='linear', fill_value='extrapolate')
        st = f(x_new)
        # 6) 30프레임 맞추기
        if len(st) < 30:
            st = np.pad(st, ((0, 30-len(st)), (0,0)), mode='edge')
        else:
            st = st[:30]
        out.append(st)
    return out

# ── /collect 엔드포인트 (데이터 저장 + 증강) ─────────────────────────────────

@app.route('/collect', methods=['POST'])
def collect_data():
    data = request.get_json()
    if not data or 'action' not in data or 'sequence' not in data:
        return jsonify({'error': "Invalid data. 'action' and 'sequence' required."}), 400

    action = data['action'].strip() or 'default'
    seq = np.array(data['sequence'])
    if not is_valid_sequence(seq):
        return jsonify({'error': 'Invalid sequence data.'}), 400

    # 저장 경로 준비
    fn = os.path.join(DATASET_DIR, action, 'data.npy')
    os.makedirs(os.path.dirname(fn), exist_ok=True)

    # 기존 데이터 로드
    if os.path.exists(fn):
        try:
            arr = np.load(fn, allow_pickle=True).tolist()
        except Exception:
            arr = []
    else:
        arr = []

    # 원본 + 증강 데이터 추가
    arr.append(seq)
    for aug in augment_sequence(seq, num_augments=1000):
        arr.append(aug)

    np.save(fn, np.array(arr, dtype=object))
    print(f"✅ '{action}' 저장 완료! 현재 개수: {len(arr)}")
    return jsonify({'message': '수집 종료!'}), 200

# ── /predict 엔드포인트 (LSTM 모델 예측) ──────────────────────────────────────

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'sequence' not in data:
        return jsonify({"error": "No sequence data provided"}), 400

    seq = np.array(data['sequence'])
    if seq.shape != (30, 147):
        return jsonify({"error": "Sequence must contain exactly 30 frames"}), 400

    batch = np.expand_dims(seq, axis=0)
    pred  = model.predict(batch)
    idx   = int(np.argmax(pred, axis=1)[0])
    conf  = float(np.max(pred))

    if idx < 0 or idx >= len(actions):
        return jsonify({'error': f'Predicted index {idx} out of range'}), 500

    result = actions[idx]
    print(f"Flask: 예측 결과 = {result}, confidence = {conf:.3f}")
    return jsonify({'result': result, 'confidence': conf}), 200

# ── 실행 ────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)