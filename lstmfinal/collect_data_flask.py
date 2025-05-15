import numpy as np
import os
from scipy.interpolate import CubicSpline, interp1d
from flask import Flask, request, jsonify

app = Flask(__name__)

# 시퀀스 유효성 검사
def is_valid_sequence(sequence, threshold=0.5):
    if sequence.shape != (30, 147):
        return False
    zero_ratio = np.sum(sequence == 0) / sequence.size
    return zero_ratio < threshold

# 결측 포인트 보간
def interpolate_missing_keypoints(sequence):
    sequence = np.array(sequence)
    num_frames, num_keypoints = sequence.shape
    for kp_idx in range(0, num_keypoints, 3):
        coords = sequence[:, kp_idx:kp_idx+3]
        valid_idx = np.where(~np.all(coords == 0, axis=1))[0]
        if len(valid_idx) < 2:
            continue
        for dim in range(3):
            try:
                spline = CubicSpline(valid_idx, coords[valid_idx, dim], extrapolate=True)
                coords[:, dim] = spline(np.arange(num_frames))
            except Exception:
                pass
        sequence[:, kp_idx:kp_idx+3] = coords
    return sequence

# 증강 함수
def augment_sequence(sequence, num_augments=1000):
    sequence = interpolate_missing_keypoints(sequence)
    if not is_valid_sequence(sequence):
        return []
    aug_list = []
    for _ in range(num_augments):
        aug_seq = sequence.copy()
        # 랜덤 시프트
        shift_x = np.random.uniform(-0.05, 0.05)
        shift_y = np.random.uniform(-0.05, 0.05)
        aug_seq[:, 0::3] += shift_x
        aug_seq[:, 1::3] += shift_y
        # 랜덤 스케일
        hand_scale = np.random.uniform(0.8, 1.2)
        aug_seq[:, 15:15+63] *= hand_scale
        aug_seq[:, 15+63:15+63+63] *= hand_scale
        distance_factor = np.random.uniform(0.9, 1.1)
        aug_seq *= distance_factor
        # 프레임 드롭 & 보간
        keep_ratio = np.random.uniform(0.8, 1.0)
        num_keep = int(30 * keep_ratio)
        keep_indices = sorted(np.random.choice(30, num_keep, replace=False))
        resampled = aug_seq[keep_indices]
        stretch = np.random.uniform(0.9, 1.1)
        new_len = max(2, int(30 * stretch))
        x_old = np.linspace(0, 1, num_keep)
        x_new = np.linspace(0, 1, new_len)
        interp = interp1d(x_old, resampled, axis=0, kind='linear', fill_value='extrapolate')
        stretched = interp(x_new)
        if len(stretched) < 30:
            pad_size = 30 - len(stretched)
            stretched = np.pad(stretched, ((0, pad_size), (0, 0)), mode='edge')
        else:
            stretched = stretched[:30]
        aug_list.append(stretched)
    return aug_list

# 데이터 수집 엔드포인트
@app.route('/collect', methods=['POST'])
def collect_data():
    data = request.get_json()
    if data is None or 'action' not in data or 'sequence' not in data:
        return jsonify({'error': "Invalid data. 'action' and 'sequence' required."}), 400

    action = data['action'].strip() or 'default'
    sequence = np.array(data['sequence'])

    if not is_valid_sequence(sequence):
        return jsonify({'error': 'Invalid sequence data.'}), 400

    # 저장 경로 준비
    dataset_path = 'dataset'
    action_path = os.path.join(dataset_path, action)
    os.makedirs(action_path, exist_ok=True)
    data_file = os.path.join(action_path, 'data.npy')

    # 기존 데이터 로드
    if os.path.exists(data_file):
        try:
            existing = np.load(data_file, allow_pickle=True).tolist()
        except Exception:
            existing = []
    else:
        existing = []

    # 원본 및 증강 데이터 추가
    existing.append(sequence)
    augmented = augment_sequence(sequence, num_augments=1000)
    existing.extend(augmented)

    # 한 번에 저장
    np.save(data_file, np.array(existing, dtype=object))
    print(f"✅ '{action}' 저장 완료! 현재 개수: {len(existing)}")

    return jsonify({'message': '수집 종료!'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
