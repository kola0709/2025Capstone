import React, { useEffect, useRef, useState } from 'react';
import Hangul from 'hangul-js';

function FingerspellDisplay() {
  const videoRef = useRef(null);
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [sequence, setSequence] = useState([]);
  const collectingRef = useRef(false);

  const [collectedLetters, setCollectedLetters] = useState([]);
  const [finalWord, setFinalWord] = useState('');

  function extractRawLeftHandLandmarks(results) {
    if (!results.leftHandLandmarks || results.leftHandLandmarks.length !== 21) {
      return null;
    }
    const landmarksNested = results.leftHandLandmarks.map(lm => [lm.x, lm.y, lm.z]);
    return landmarksNested.flat();
  }

  function extractVectorFeatures3D_PythonEquivalent(landmarks_flat) {
    if (!landmarks_flat || landmarks_flat.length !== 21 * 3) {
      return null;
    }

    const getJoint = (index) => {
      const i = index * 3;
      return [landmarks_flat[i], landmarks_flat[i + 1], landmarks_flat[i + 2]];
    };

    const subtractVectors = (v1, v2) => [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const vectorNorm = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    const normalizeVector = (v) => {
      const norm = vectorNorm(v);
      if (norm < 1e-6) return [0, 0, 0];
      return [v[0] / norm, v[1] / norm, v[2] / norm];
    };
    const dotProduct = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const v_source_indices1 = [0,1,2,3,0,5,6,7,0,9,10,11,0,13,14,15,0,17,18,19];
    const v_source_indices2 = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
    const v_normalized_vectors = [];

    for (let i = 0; i < v_source_indices1.length; i++) {
      const joint1 = getJoint(v_source_indices1[i]);
      const joint2 = getJoint(v_source_indices2[i]);
      const vec = subtractVectors(joint1, joint2);
      const normalized_vec = normalizeVector(vec);
      v_normalized_vectors.push(...normalized_vec);
    }

    const getNormalizedBoneVector = (index) => {
      const i = index * 3;
      return [v_normalized_vectors[i], v_normalized_vectors[i + 1], v_normalized_vectors[i + 2]];
    };

    const angle_idx1 = [0,1,2,4,5,6,8,9,10,12,13,14,16,17,18];
    const angle_idx2 = [1,2,3,5,6,7,9,10,11,13,14,15,17,18,19];
    const angles = [];

    for (let i = 0; i < angle_idx1.length; i++) {
      const vec_i = getNormalizedBoneVector(angle_idx1[i]);
      const vec_j = getNormalizedBoneVector(angle_idx2[i]);
      let dot = dotProduct(vec_i, vec_j);
      dot = Math.max(-1.0, Math.min(1.0, dot));
      const angle_rad = Math.acos(dot);
      angles.push(toDegrees(angle_rad));
    }

    const base_indices = [5, 9, 13, 17];
    const inter_angles = [];
    const wrist_joint = getJoint(0);

    for (let i = 0; i < base_indices.length - 1; i++) {
      const mcp1_joint = getJoint(base_indices[i]);
      const mcp2_joint = getJoint(base_indices[i + 1]);

      let vi = subtractVectors(mcp1_joint, mcp2_joint);
      vi = normalizeVector(vi);

      let vj = subtractVectors(wrist_joint, mcp1_joint);
      vj = normalizeVector(vj);

      let dot = dotProduct(vi, vj);
      dot = Math.max(-1.0, Math.min(1.0, dot));
      const angle_rad = Math.acos(dot);
      inter_angles.push(toDegrees(angle_rad));
    }

    return [...v_normalized_vectors, ...angles, ...inter_angles];
  }

  useEffect(() => {
    if (!videoRef.current || !window.Holistic || !window.Camera) return;

    if (!holisticRef.current) {
      const holistic = new window.Holistic({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      holistic.onResults(results => {
        const raw_landmarks_flat = extractRawLeftHandLandmarks(results);
        if (!raw_landmarks_flat) return;

        const features = extractVectorFeatures3D_PythonEquivalent(raw_landmarks_flat);
        if (!features) return;

        setSequence(seq => {
          const next = [...seq, features];
          if (next.length === 10 && !collectingRef.current) {
            collectingRef.current = true;
            fetch('http://localhost:5001/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sequence: next }),
            })
              .then(res => res.json())
              .then(data => {
                setPrediction(data.prediction || '');
                setConfidence(data.confidence || 0);
              })
              .catch(err => console.error('❌ 오류', err))
              .finally(() => {
                collectingRef.current = false;
                setSequence([]);
              });
            return [];
          }
          return next.length > 10 ? next.slice(-10) : next;
        });
      });

      holisticRef.current = holistic;
    }

    if (!cameraRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && holisticRef.current) {
            await holisticRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, []);

  const handleAddLetter = () => {
    if (prediction) {
      setCollectedLetters(prev => [...prev, prediction]);
      setPrediction('');
    }
  };

  const handleMergeWord = () => {
    const word = Hangul.assemble(collectedLetters.join(''));
    setFinalWord(word);
  };

  return (
    <div style={{ backgroundColor: "#f5fde9", textAlign: "center", minHeight: "100vh" }}>
      <h2 style={{ fontSize: "30px", marginBottom: "30px", color: "#3c4b3f" }}>
        지문자 수어 예측
      </h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "40px"
      }}>
        {/* 비디오 박스 */}
        <div style={{
          width: "640px",
          height: "550px",
          padding: "20px",
          borderRadius: "16px",
          backgroundColor: "#000",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "12px"
            }}
          />
        </div>

        {/* 결과 출력 */}
        <div style={{
          width: "640px",
          height: "550px",
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "#f7fff6",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "20px"
        }}>
          <h3 style={{ fontSize: "24px", color: "#3a5e4c" }}>예측 결과</h3>
          <p style={{ fontSize: "36px", color: "#1a3e2a", fontWeight: "bold" }}>
            {prediction}
          </p>
          <p style={{ fontSize: "20px", color: "#3a5e4c" }}>
            신뢰도: {(confidence * 100).toFixed(2)}%
          </p>

          <button onClick={handleAddLetter} style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#7fa68c",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer"
          }}>
            자모 추가
          </button>

          <textarea
            value={collectedLetters.join(' ')}
            placeholder="인식된 자모가 여기에 쌓입니다"
            style={{
              width: "100%",
              height: "80px",
              fontSize: "18px",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #a7c8b5",
              backgroundColor: "#ffffff",
              resize: "none"
            }}
          />

          <button onClick={handleMergeWord} style={{
            padding: "10px 30px",
            fontSize: "16px",
            backgroundColor: "#5d947c",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer"
          }}>
            단어 합치기
          </button>

          {finalWord && (
            <div>
              <h4 style={{ marginTop: "20px", color: "#3c5c44" }}>최종 단어</h4>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#2e4635" }}>{finalWord}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FingerspellDisplay;
