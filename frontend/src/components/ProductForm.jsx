import React, { useState, useEffect } from 'react';

const ProductForm = ({ product, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        stock: '',
        image: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                description: product.description || '',
                price: product.price || '',
                stock: product.stock || '',
                image: product.image || ''
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h2>{product ? 'Редактировать товар' : 'Создать новый товар'}</h2>
                <form onSubmit={handleSubmit} className="product-form">
                    <div className="form-group">
                        <label htmlFor="name">Название товара *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Введите название товара"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Категория *</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            placeholder="Введите категорию"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            placeholder="Введите описание товара"
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="price">Цена (₽) *</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="1"
                                placeholder="0"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="stock">Количество на складе *</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                step="1"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="image">Путь к изображению</label>
                        <input
                            type="text"
                            id="image"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="/images/example.jpg"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {product ? 'Сохранить изменения' : 'Создать товар'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;