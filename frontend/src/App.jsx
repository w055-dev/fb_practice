import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';
import './styles/output.css';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/products');
            setProducts(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка при загрузке товаров. Пожалуйста, проверьте подключение к серверу.');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

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
                alert('Товар успешно удален!');
            } catch (err) {
                console.error('Error deleting product:', err);
                alert('Ошибка при удалении товара');
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingProduct) {
                await axios.patch(`/api/products/${editingProduct.id}`, formData);
                alert('Товар успешно обновлен!');
            } else {
                await axios.post('/api/products', formData);
                alert('Товар успешно создан!');
            }
            await fetchProducts();
            setShowForm(false);
            setEditingProduct(null);
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Ошибка при сохранении товара');
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingProduct(null);
    };

    if (loading) return <div className="loading">Загрузка товаров</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <main className="main">
            <div className="header">
                <h1>Детективный магазин</h1>
                <button className="btn-create" onClick={handleCreate}>
                    + Создать товар
                </button>
            </div>

            {showForm && (
                <ProductForm 
                    product={editingProduct}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            )}

            <div className="goods">
                {products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product}
                        onEdit={() => handleEdit(product)}
                        onDelete={() => handleDelete(product.id)}
                    />
                ))}
            </div>
        </main>
    );
}

export default App;