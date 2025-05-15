// LoginPage.jsx
import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setIsLoggedIn }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/login', {
        userId,
        password
      }, {
        withCredentials: true
      });

      console.log('✅ 로그인 응답:', res.data);

      if (res.data === '로그인 성공') {
        setIsLoggedIn(true); // ✅ 로그인 상태 업데이트
        alert('로그인 성공');
        navigate(-1);
      } else {
        alert('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px' }}>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label>아이디</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>로그인</button>
      </form>
    </div>
  );
};

export default LoginPage;
