from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf

app = Flask(__name__)

actions = np.array(["감사", "네모", "동그라미", "만나다", "많이", "세모", "안녕하세요", "즐기다", "테스트2", "헤어지다"])

# 모델 파일 위치를 확인하여 LSTM 모델 로드
model = tf.keras.models.load_model("sign_language_lstm.h5")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if data is None or 'sequence' not in data:
        print("Flask: 좌표 데이터가 전달되지 않음.")
        return jsonify({"error": "No sequence data provided"}), 400

    sequence = np.array(data['sequence'])
    print("Flask: 받은 좌표 시퀀스 shape =", sequence.shape)
    
    if sequence.shape[0] != 30:
        print("Flask: 프레임 수가 30개 아님.")
        return jsonify({"error": "Sequence must contain exactly 30 frames"}), 400

    input_data = np.expand_dims(sequence, axis=0)
    prediction = model.predict(input_data)
    confidence = float(np.max(prediction))
    action_index = int(np.argmax(prediction, axis=1)[0])
    result = actions[action_index]
    
    print("Flask: 예측 결과 =", result, ", confidence =", confidence)

    response = {"result": result, "confidence": confidence}
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
