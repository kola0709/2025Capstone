import { useState } from "react";
import { Button, ViewContainer } from "./Styles";

function WordInput({ word, setWord, fetchVideo }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      height: "100%",
    }}>
      <input
        type="text"
        placeholder="단어 입력 (예: 추억)"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        style={{
          width: "280px",
          height: "160px",
          fontSize: "18px",
          backgroundColor: "#f0f8ff",
          borderRadius: "12px",
          border: "1.5px solid #b5c7bd",
          padding: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
        }}
      />
      <button
        style={{
          ...Button,
          width: "120px",
          padding: "12px 20px",
          borderRadius: "25px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: "#7e9e89",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s"
        }}
        onClick={fetchVideo}
        onMouseOver={(e) => e.target.style.backgroundColor = "#5f7d6d"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#7e9e89"}
      >
        확인
      </button>
    </div>
  );
}

function SignVideoPlayer() {
  const [word, setWord] = useState("");
  const [videoFileName, setVideoFileName] = useState("");

  const fetchVideo = async () => {
    const encodedWord = encodeURIComponent(word);
    const response = await fetch(`http://localhost:8080/sign/${encodedWord}`);
    if (!response.ok) {
      console.error("서버에서 영상을 찾을 수 없음");
      setVideoFileName("");
      return;
    }
    const videoTitle = await response.text();
    setVideoFileName(videoTitle);
  };

  return (
    <div style={{
      backgroundColor: "#f5fde9",
      textAlign: "center",
      minHeight: "500vh"
    }}>
      <h2 style={{ fontSize: "30px", marginBottom: "30px", color: "#3c4b3f" }}>
        단어를 수어로 번역
      </h2>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "40px"
      }}>
        <div style={{
          ...ViewContainer,
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "#f7fff6",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: "360px",
          minHeight: "300px"
        }}>
          <WordInput word={word} setWord={setWord} fetchVideo={fetchVideo} />
        </div>

        <div style={{
          ...ViewContainer,
          width: "440px",
          minHeight: "300px",
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "#eeeeee",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          {videoFileName ? (
            <>
              <h3 style={{ marginBottom: "16px", color: "#333" }}>영상</h3>
              <video
                width="360"
                controls
                muted
                autoPlay
                playsInline
                style={{ borderRadius: "10px" }}
              >
                <source src={`http://localhost:8080/${videoFileName}`} type="video/mp4" />
              </video>
            </>
          ) : (
            <p style={{ color: "#555", fontSize: "16px" }}>영상이 존재하지 않습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignVideoPlayer;
