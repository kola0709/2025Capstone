import '../css/Quiz.css';
import { useEffect, useState } from 'react';

function Answer({ value, onChange }) {
    return (
        <div>
            <input
                type="text"
                placeholder="정답을 입력하세요"
                className="quiz-input"
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

function SignView({ videoFileName }) {
    return (
        <div className="video-box">
            <video className="sign-video" muted autoPlay playsInline loop>
                <source src={`http://localhost:8080/${videoFileName}`} type="video/mp4" />
                브라우저가 비디오 태그를 지원하지 않습니다.
            </video>
        </div>
    );
}

export default function Quiz() {
    const [videoFileName, setVideoFileName] = useState("");
    const [word, setWord] = useState('');
    const [userInput, setUserInput] = useState('');

    useEffect(() => {
        fetch('http://localhost:8080/api/quiz')
            .then((response) => response.json())
            .then((data) => {
                setWord(data.word);
                setVideoFileName(data.title);
            })
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    const handleCheckAnswer = () => {
        if (userInput === word) {
            alert("정답입니다!");
        } else {
            alert("틀렸습니다. 다시 시도해보세요!");
        }
    };

    return (
        <div className="quiz-container">
            <h1 className="quiz-title">수어 맞추기 게임🎮</h1>
            <div className="quiz-section">
                <div className="quiz-video">
                    <SignView videoFileName={videoFileName} />
                </div>
                <div className="quiz-answer">
                    <h2>정답 입력</h2>
                    <Answer value={userInput} onChange={(e) => setUserInput(e.target.value)} />
                    <button className="quiz-button" onClick={handleCheckAnswer}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
