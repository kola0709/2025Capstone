from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib

app = Flask(__name__)
CORS(app)

model = tf.keras.models.load_model("fingerspelling_vector3d_lstm.h5")
le = joblib.load("label_encoder.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    sequence = data.get('sequence')

    if not sequence or len(sequence) != 10 or len(sequence[0]) != 78:
        return jsonify({'error': 'Invalid input shape'}), 400

    input_data = np.array(sequence, dtype=np.float32).reshape(1, 10, 78)

    try:
        y_pred = model.predict(input_data)[0]  # (31,)
        i_pred = int(np.argmax(y_pred))
        conf = float(y_pred[i_pred])
        label = le.inverse_transform([i_pred])[0]
        return jsonify({'prediction': label, 'confidence': conf})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
