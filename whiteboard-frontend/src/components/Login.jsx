import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);  // Estado para erros
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', {
        email,
        password
      });
      console.log(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/sessions');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao fazer login');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}  {/* Exibe o erro aqui */}
      <div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </label>
      </div>
      <div>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
          />
        </label>
      </div>
      <button type="submit">Entrar</button>
    </form>
  );
}

export default Login;
