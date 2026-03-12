import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const response = await axios.post('/api/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLoginSuccess(response.data.user);
            } else {
                await axios.post('/api/auth/register', {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                });
                const loginResponse = await axios.post('/api/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('accessToken', loginResponse.data.accessToken);
                localStorage.setItem('refreshToken', loginResponse.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
                onLoginSuccess(loginResponse.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Детективный магазин</h2>
                    <p>{isLogin ? 'Вход в систему' : 'Регистрация'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="name">Имя</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Шерлок Холмс"
                                required={!isLogin}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="sherlock@bakerstreet.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="******"
                            required
                            disabled={loading}
                            minLength="6"
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                    </button>
                </form>

                <div className="auth-footer">
                    <button 
                        className="auth-switch"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setFormData({ name: '', email: '', password: '' });
                        }}
                        disabled={loading}
                    >
                        {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;