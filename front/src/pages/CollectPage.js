import React, { useEffect, useRef, useState } from 'react';

export default function CollectPage() {
  const videoRef = useRef(null);
  const isSending = useRef(false);
  const [action, setAction] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [framesCollected, setFramesCollected] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [training, setTraining] = useState(false);

  const faceIndices = [1, 33, 263, 61, 291];
  const poseIndices = [11, 12];
  const handIndices = Array.from({ length: 21 }, (_, i) => i);

  function extractKeypoints(results) {
    const flatten = (landmarks, indices) => {
      if (!landmarks) return new Array(indices.length * 3).fill(0);
      return indices.flatMap(i => {
        const lm = landmarks[i];
        if (!lm) return [0, 0, 0];
        return [lm.x, lm.y, lm.z];
      });
    };

    const face = flatten(results.faceLandmarks, faceIndices);
    const lh = flatten(results.leftHandLandmarks, handIndices);
    const rh = flatten(results.rightHandLandmarks, handIndices);
    const pose = flatten(results.poseLandmarks, poseIndices);

    return [...face, ...lh, ...rh, ...pose];
  }

  useEffect(() => {
    if (!videoRef.current || !window.Holistic || !window.Camera) return;

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
      if (!collecting || isSending.current) return;

      const keypoints = extractKeypoints(results);

      setSequence(seq => {
        const next = [...seq, keypoints];
        setFramesCollected(next.length);

        if (next.length === 30) {
          isSending.current = true;
          console.log("▶ 전송 시작", { action, sequence: next });

          fetch('http://localhost:8080/api/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, sequence: next }),
          })
            .then(res => res.json().then(console.log))
            .catch(console.error)
            .finally(() => {
              setCollecting(false);
              isSending.current = false;
              setSequence([]);
              setFramesCollected(0);
            });
        }

        return next;
      });
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await holistic.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [collecting]);

  const startCollect = () => {
    if (!action.trim()) return alert('라벨을 입력하세요.');
    setTimer(3);

    const countdown = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(countdown);
          setCollecting(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const startTraining = async () => {
    setTraining(true);
    try {
      const res = await fetch('http://localhost:8080/api/train', { method: 'POST' });
      const data = await res.text();
      alert(data); // "학습 완료!" 등
    } catch (err) {
      console.error('학습 오류:', err);
      alert('학습 중 오류 발생');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="collect-container">
      <h1>프레임 수집</h1>
      <input
        type="text"
        placeholder="동작 라벨"
        value={action}
        onChange={e => setAction(e.target.value)}
      />
      <button onClick={startCollect} disabled={collecting}>
        {collecting ? '수집중...' : '수집 시작'}
      </button>
      <button onClick={startTraining} disabled={training}>
        {training ? '학습 중...' : '학습하기'}
      </button>
      {timer > 0 && <p>준비: {timer}초</p>}
      {collecting && <p>수집된 프레임: {framesCollected}/30</p>}
      <video
        ref={videoRef}
        className="output_video"
        style={{ width: 640, height: 480 }}
        autoPlay
        muted
      />
    </div>
  );
}
