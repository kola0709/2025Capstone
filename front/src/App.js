/*
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, RouterProvider } from 'react-router-dom';
import CollectPage from './pages/CollectPage';
import TestPage from './pages/TestPage'
import FingerspellCollectPage from './pages/FingerspellCollectPage';
import FingerspellTestPage from './pages/FingerspellTestPage';

import Education2 from './components/EducationPage/EducationPage'
import Main from './components/MainPage/MainPage'
import Quiz from './pages/Quiz.jsx'
import KoreanCharacterDisplay from './components/KoreanCharacterDispaly.js'
import ToSign from './pages/ToSign.jsx'
import './App.css'

import LSTMDisplay from './pages/LSTMDisplay.jsx'
import FingerspellDisplayNoStop from './pages/FingerspellDisplayNoStop.jsx'
import FingerspellDisplayStop from './pages/FingerspellDisplayStop.jsx'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

import axios from './api/axios';

function App() {
  const [mode, setMode] = useState('signToText');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios.get('/api/session', { withCredentials: true })
      .then(res => {
        setIsLoggedIn(res.data !== '세션 없음');
      })
      .catch(err => {
        console.error("세션 확인 실패:", err);
      });
  }, []);

  return (
    <div className='App'>
      <Routes>
        <Route path='/' element={<Main />} />
        <Route path='/education' element={<Education2 />} />
        <Route path='/quiz' element={<Quiz />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />

        { 번역하기 통합 페이지 }
        <Route
          path='/transport'
          element={
            <div className='translate-page'>
              <aside className='sidebar'>
                <button onClick={() => setMode('example')}>예시 페이지</button>
                <button onClick={() => setMode('signToTextLSTM')}>수어를 단어로 번역 (수어)</button>
                <button onClick={() => setMode('signToTextFingerspell')}>수어를 단어로 번역 (지문자)</button>
                <button onClick={() => setMode('textToSign')}>단어를 수어로 번역</button>
              </aside>
              <section className='content'>
                {!(mode === 'example' || mode === 'signToTextLSTM' || mode === 'signToTextFingerspell' || mode === 'textToSign') && (
                  <div style={{ fontSize: '24px', color: '#444', paddingTop: '100px' }}>
                    왼쪽 사이드바에서 원하는 기능을 클릭하세요!
                  </div>
                )}
                {mode === 'example' && <KoreanCharacterDisplay />}
                {mode === 'signToTextLSTM' && <LSTMDisplay />}
                {mode === 'signToTextFingerspell' && <FingerspellDisplayStop />}
                {mode === 'textToSign' && <ToSign />}
              </section>
            </div>
          }
        />
      </Routes>
    </div>
  );
  

  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
        <Link to="/collect">데이터 수집</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Link to="/test">데이터 테스트</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Link to="/fingerspellCollect">지문자 수집</Link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Link to="/fingerspellTest">지문자 테스트</Link>
      </nav>
      <Routes>
        <Route path="/collect" element={<CollectPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path='/fingerspellCollect' element={<FingerspellCollectPage />} />
        <Route path='/fingerspellTest' element={<FingerspellTestPage />} />
      </Routes>
    </div>
  );

}

export default App;
*/
// App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from './api/axios';

// 추가된 Header
import Header from './components/Header'; // 경로 확인 필수

// 페이지 컴포넌트
import Main from './components/MainPage/MainPage';
import Education2 from './components/EducationPage/EducationPage';
import Quiz from './pages/Quiz';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KoreanCharacterDisplay from './components/KoreanCharacterDispaly';
import ToSign from './pages/ToSign';
import LSTMDisplay from './pages/LSTMDisplay';
import FingerspellDisplayStop from './pages/FingerspellDisplayStop';
import './App.css'
import Mypage from './pages/Mypage';

function App() {
  const [mode, setMode] = useState('signToText');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios.get('/api/session', { withCredentials: true })
      .then(res => {
        setIsLoggedIn(res.data !== '세션 없음');
      })
      .catch(err => {
        console.error("세션 확인 실패:", err);
      });
  }, []);

  return (
    <div className='App'>
      {/* ✅ 여기에 Header 렌더링 */}
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        <Route path='/' element={<Main />} />
        <Route path='/education' element={<Education2 />} />
        <Route path='/quiz' element={<Quiz />} />
        <Route path='/login' element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/mypage' element={<Mypage />} />

        <Route
          path='/transport'
          element={
            <div className='translate-page'>
              <aside className='sidebar'>
                <button onClick={() => setMode('example')}>예시 페이지</button>
                <button onClick={() => setMode('signToTextLSTM')}>수어를 단어로 번역 (수어)</button>
                <button onClick={() => setMode('signToTextFingerspell')}>수어를 단어로 번역 (지문자)</button>
                <button onClick={() => setMode('textToSign')}>단어를 수어로 번역</button>
              </aside>
              <section className='content'>
                {mode === 'example' && <KoreanCharacterDisplay />}
                {mode === 'signToTextLSTM' && <LSTMDisplay />}
                {mode === 'signToTextFingerspell' && <FingerspellDisplayStop />}
                {mode === 'textToSign' && <ToSign />}
              </section>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

