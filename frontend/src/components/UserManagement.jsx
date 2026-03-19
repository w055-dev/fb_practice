import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = ({ onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка при загрузке пользователей');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
            try {
                await axios.delete(`/api/users/${userId}`);
                await fetchUsers();
            } catch (err) {
                alert('Ошибка при блокировке пользователя');
            }
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            await axios.put(`/api/users/${editingUser.id}`, userData);
            setEditingUser(null);
            await fetchUsers();
        } catch (err) {
            alert('Ошибка при обновлении пользователя');
        }
    };

    if (loading) return <div className="loading">Загрузка пользователей...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user_management-overlay">
            <div className="user_management-container">
                <div className="user_management-header">
                    <h2>Управление пользователями</h2>
                    <button className="btn btn-delete" onClick={onClose}>Закрыть</button>
                </div>

                {editingUser ? (
                    <UserEditForm 
                        user={editingUser}
                        onSubmit={handleUpdateUser}
                        onCancel={() => setEditingUser(null)}
                    />
                ) : (
                    <div className="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Имя</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className={user.isBlocked ? 'blocked' : ''}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge role-${user.role}`}>
                                                {user.role === 'admin' ? 'Администратор' :
                                                 user.role === 'seller' ? 'Продавец' : 'Пользователь'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                                                {user.isBlocked ? 'Заблокирован' : 'Активен'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-edit"
                                                onClick={() => setEditingUser(user)}
                                                disabled={user.isBlocked}
                                            >
                                                Редактировать
                                            </button>
                                            {!user.isBlocked && (
                                                <button 
                                                    className="btn btn-delete"
                                                    onClick={() => handleBlockUser(user.id)}
                                                >
                                                    Заблокировать
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserEditForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        role: user.role
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="user_edit-form">
            <h3>Редактирование пользователя</h3>
            
            <div className="form-group">
                <label>Имя</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>

            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            <div className="form-group">
                <label>Роль</label>
                <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                    <option value="user">Пользователь</option>
                    <option value="seller">Продавец</option>
                    <option value="admin">Администратор</option>
                </select>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Отмена
                </button>
            </div>
        </form>
    );
};

export default UserManagement;