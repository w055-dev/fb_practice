import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';
import Auth from './components/Auth';
import UserManagement from './components/UserManagement';
import './styles/output.css';

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post('/api/auth/refresh', {
                    refreshToken: refreshToken
                });
                
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.reload();
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

function App() {
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showUserManagement, setShowUserManagement] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/products');
            setProducts(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка при загрузке товаров');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        setShowForm(false);
        setEditingProduct(null);
        setShowUserManagement(false);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await axios.delete(`/api/products/${id}`);
                await fetchProducts();
            } catch (err) {
                alert('Ошибка при удалении товара');
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingProduct) {
                await axios.put(`/api/products/${editingProduct.id}`, formData);
            } else {
                await axios.post('/api/products', formData);
            }
            await fetchProducts();
            setShowForm(false);
            setEditingProduct(null);
        } catch (err) {
            alert('Ошибка при сохранении товара');
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingProduct(null);
    };
    
    const canCreateProduct = user?.role === 'seller' || user?.role === 'admin';
    const canManageUsers = user?.role === 'admin';

    if (!user) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    if (loading) return <div className="loading">Загрузка товаров...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <main className="main">
            <h1>Детективный магазин</h1>
            <div className="header">
                <div>
                    <div className="user-info">
                        <span>Привет, {user.name}!</span>
                        <span className="user-role">
                            ({user.role === 'admin' ? 'Администратор' : user.role === 'seller' ? 'Продавец' : 'Пользователь'})
                        </span>
                        {canManageUsers && (
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowUserManagement(true)}
                            >
                                Управление пользователями
                            </button>
                        )}
                        <button className="btn-logout" onClick={handleLogout}>
                            Выйти
                        </button>
                    </div>
                </div>
                {canCreateProduct && (
                    <button className="btn-create" onClick={handleCreate}>
                        + Создать товар
                    </button>
                )}
            </div>

            {showForm && (
                <ProductForm 
                    product={editingProduct}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            )}

            {showUserManagement && (
                <UserManagement onClose={() => setShowUserManagement(false)} />
            )}

            <div className="goods">
                {products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product}
                        userRole={user.role}
                        onEdit={() => handleEdit(product)}
                        onDelete={() => handleDelete(product.id)}
                    />
                ))}
            </div>
        </main>
    );
}

export default App;