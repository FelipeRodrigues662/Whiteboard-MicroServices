import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar usuário');
      }

      // Se der tudo certo, redireciona para a tela de login
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Registrar</h2>

      <label>
        Nome
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome"
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </label>

      <label>
        Senha
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Senha"
          required
        />
      </label>

      <button type="submit">Registrar</button>
    </form>
  );
}

export default Register;
