from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import random
from scipy.spatial.transform import Rotation as R

app = Flask(__name__)
CORS(app)

# ✅ 증강 함수
def diverse_augment_sequence(sequence, num_augments=200, angle_range=(-10, 10)):
    augmented = []
    for _ in range(num_augments):
        new_seq = []

        axes = random.sample(['x', 'y', 'z'], k=random.randint(1, 3))
        angles = {
            'x': random.uniform(*angle_range) if 'x' in axes else 0,
            'y': random.uniform(*angle_range) if 'y' in axes else 0,
            'z': random.uniform(*angle_range) if 'z' in axes else 0,
        }
        rot = R.from_euler('xyz', [angles['x'], angles['y'], angles['z']], degrees=True)

        noise = np.random.normal(0, 0.01, (42, 3))
        shear_angle = random.uniform(-5, 5)
        shear_rot = R.from_euler('y', shear_angle, degrees=True) if random.random() < 0.5 else None
        finger_scales = {base: np.random.uniform(0.95, 1.05) for base in [1, 5, 9, 13, 17]}

        for frame in sequence:
            joints = frame.reshape(-1, 3)
            center = joints[0]
            moved = joints - center
            rotated = rot.apply(moved)
            rotated += noise
            for base in finger_scales:
                scale = finger_scales[base]
                rotated[base:base+4] = (rotated[base:base+4] - rotated[base]) * scale + rotated[base]
            if shear_rot is not None:
                rotated = shear_rot.apply(rotated)
            final = rotated + center
            new_seq.append(final.flatten())
        augmented.append(np.array(new_seq))
    return augmented

# ✅ 유효성 검사
def is_valid_sequence(sequence, threshold=0.6):
    if sequence.shape != (10, 126):
        return False
    zero_ratio = np.sum(sequence == 0) / sequence.size
    return zero_ratio < threshold

# ✅ group 단위 저장 함수
def save_group_data(action, sequences):
    dataset_path = "dataset"
    action_path = os.path.join(dataset_path, action)
    os.makedirs(action_path, exist_ok=True)

    existing_groups = [f for f in os.listdir(action_path) if f.startswith("group_") and f.endswith(".npy")]
    group_nums = [int(f.split("_")[1].split(".")[0]) for f in existing_groups]
    next_group_num = max(group_nums) + 1 if group_nums else 1

    filename = f"group_{next_group_num:03d}.npy"
    filepath = os.path.join(action_path, filename)
    np.save(filepath, np.array(sequences))
    print(f"✅ '{action}' → '{filename}' 저장 완료! (총 {len(sequences)}개)")

@app.route('/collect', methods=['POST'])
def collect():
    try:
        data = request.get_json()
        action = data.get('action', '').strip()
        sequence = data.get('sequence', [])

        if not action or not sequence or len(sequence) != 10:
            return jsonify({'error': 'Invalid input'}), 400

        sequence = np.array(sequence)

        if not is_valid_sequence(sequence):
            return jsonify({'error': 'Invalid keypoints'}), 400

        aug_sequences = [sequence] + diverse_augment_sequence(sequence)
        save_group_data(action, aug_sequences)

        return jsonify({'message': f'{action} 저장 완료'}), 200

    except Exception as e:
        print("❌ 오류:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
