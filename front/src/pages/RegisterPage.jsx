import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function RegisterPage() {
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/register', {
        userId,
        nickname,
        studentId,
        password
      });

      if (res.data === '회원가입 성공') {
        alert('🎉 회원가입 성공!');
        navigate('/login');
      } else {
        setError(res.data);
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError('회원가입 요청 실패');
    }
  };

  return (
    <div style={{ paddingTop: '100px', textAlign: 'center' }}>
      <h2>회원가입</h2>
      <form onSubmit={handleRegister} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="학번"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 20px' }}>회원가입</button>
      </form>
    </div>
  );
}

export default RegisterPage;
