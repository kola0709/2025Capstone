/*
import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import Hangul from 'hangul-js';

function LSTMDisplay() {
  const [inputLetters, setInputLetters] = useState([]);
  const [finalWord, setFinalWord] = useState('');
  const videoRef = useRef(null);

  // 웹캠 스트림 설정
  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('웹캠 접근 에러:', err);
      }
    }
    setupWebcam();
  }, []);

  // STOMP 메시지 수신
  useEffect(() => {
    const socketUrl = 'ws://localhost:8080/ws';
    const stompClient = new Client({
      webSocketFactory: () => new WebSocket(socketUrl),
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    stompClient.onConnect = () => {
      console.log("웹소켓 연결 성공");
      stompClient.subscribe('/topic/characters', (message) => {
        if (message.body) {
          setInputLetters(prev => [...prev, message.body]);
        }
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const handleLetterRemove = (index) => {
    setInputLetters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const composed = Hangul.assemble(inputLetters);
    setFinalWord(composed);
    setInputLetters([]);
  };

  const handleReadAloud = () => {
    if (!finalWord) return;
    const utterance = new SpeechSynthesisUtterance(finalWord);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{
      backgroundColor: "#f5fde9",
      textAlign: "center",
      minHeight: "100vh"
    }}>
      <h2 style={{ fontSize: "30px", marginBottom: "30px", color: "#3c4b3f" }}>
        수어 인식 및 단어 조합
      </h2>

      <div style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "40px"
      }}>
        { 비디오 창 }
        <div style={{
          width: "640px",
          height: "480px",
          borderRadius: "16px",
          marginTop: "30px",
          backgroundColor: "#000",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflow: "hidden"
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
              borderRadius: "16px"
            }}
          />
        </div>

        { 입력된 자모 박스 }
        <div style={{
          width: "320px",
          minHeight: "300px",
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "#f7fff6",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          display: "flex",
          marginTop: "30px",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px"
        }}>
          <h3 style={{ marginBottom: "10px", color: "#3a5e4c" }}>입력된 자모</h3>
          <div style={{
            minHeight: "50px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px"
          }}>
            {inputLetters.map((letter, index) => (
              <span
                key={index}
                onClick={() => handleLetterRemove(index)}
                style={{
                  padding: '6px 12px',
                  background: '#e0f1e8',
                  border: '1px solid #a7c8b5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#7fa68c',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                width: '120px'
              }}
            >
              제출
            </button>
            <button
              onClick={handleReadAloud}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#a8bfa9',
                color: '#fff',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                width: '120px'
              }}
            >
              음성읽기
            </button>
          </div>
        </div>
      </div>

      { 최종 단어 출력 }
      {finalWord && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#3c5c44' }}>최종 단어</h2>
          <p style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#2e4635',
            marginTop: '10px',
          }}>
            {finalWord}
          </p>
        </div>
      )}
    </div>
  );
}

export default LSTMDisplay;
*/

import React, { useEffect, useRef, useState } from 'react';

function LSTMDisplay() {
  const videoRef = useRef(null);
  const collectingRef = useRef(false);
  const [timer, setTimer] = useState(0);
  const [framesCollected, setFramesCollected] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [predictedText, setPredictedText] = useState('');

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

    return [...face, ...lh, ...rh, ...pose]; // length === 147
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
        if (!collectingRef.current) return;
        const keypoints = extractKeypoints(results);
  
        setSequence(seq => {
          const next = [...seq, keypoints];
          setFramesCollected(next.length);
  
          if (next.length === 30) {
            console.log("▶ 예측 요청", next);
  
            fetch('http://localhost:8080/api/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sequence: next }),
            })
              .then(res => res.json())
              .then(data => {
                if (data && data.result && data.confidence !== undefined) {
                  setPrediction(data.result);
                  setConfidence((data.confidence * 100).toFixed(2));
                  setPredictedText(prev => prev + data.result);
                } else {
                  console.error("Invalid response format:", data);
                }
              })
              .catch(console.error)
              .finally(() => {
                collectingRef.current = false;
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
    }, []);

    const startPredict = () => {
    setTimer(3);
    setPrediction('');
    setConfidence(null);

    const countdown = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(countdown);
          collectingRef.current = true;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };
  return (
  <div
    style={{
      backgroundColor: "#f5fde9",
      textAlign: "center",
      minHeight: "100vh"
    }}
  >
    <h2 style={{ fontSize: "30px", marginBottom: "30px", color: "#3c4b3f" }}>
      수어 예측
    </h2>

    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "40px"
      }}
    >
      {/* 비디오 창 */}
      <div
        style={{
          width: "640px",
          height: "550px",
          padding: "20px",
          borderRadius: "16px",
          backgroundColor: "#000",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "16px"
          }}
        />
      </div>

      {/* 텍스트 출력 박스 + 버튼 */}
      <div
        style={{
          width: "640px",
          height: "550px",
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "#f7fff6",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px"
        }}
      >
        <div style={{ width: "100%" }}>
          <h3 style={{ marginBottom: "10px", color: "#3a5e4c", textAlign: "center" }}>출력된 문장</h3>
          <textarea
            value={predictedText}
            onChange={e => setPredictedText(e.target.value)}
            style={{
              width: "90%",
              height: "320px",
              fontSize: "1.2rem",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #a7c8b5",
              resize: "none",
              backgroundColor: "#ffffff",
              justifyContent: 'center'
            }}
          />
        </div>

        {/* 예측 시작 버튼 */}
        <button
          onClick={startPredict}
          disabled={collectingRef.current || timer > 0}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            fontSize: "16px",
            backgroundColor: "#7fa68c",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            width: "100%",
            height: "50px"
          }}
        >
          {timer > 0
            ? `준비 중... (${timer}초)`
            : collectingRef.current
            ? `예측 중... (${framesCollected}/30)`
            : "예측 시작"}
        </button>
      </div>
    </div>

    {/* 예측 결과 아래에 별도 출력하고 싶다면 여기에 표시할 수 있음 */}
    {prediction && (
      <div style={{ marginTop: "30px", color: "#2f4f3e" }}>
        ✅ 예측 결과: <strong style={{ color: "#1a3e2a" }}>{prediction}</strong> (
        <strong>{confidence}%</strong>)
      </div>
    )}
  </div>
);

}

export default LSTMDisplay;