import React from 'react';

const ProductCard = ({ product, onEdit, onDelete }) => {
    const getStockStatus = (stock) => {
        if (stock <= 0) return { 
            text: 'Нет в наличии', 
            className: 'card__stock--out-of-stock' 
        };
        if (stock <= 5) return { 
            text: `Осталось ${stock} шт.`, 
            className: 'card__stock--low-stock' 
        };
        return { 
            text: `В наличии (${stock} шт.)`, 
            className: 'card__stock--in-stock' 
        };
    };

    const stockStatus = getStockStatus(product.stock);

    return (
        <article className="card">
            <img 
                className="card__image" 
                src={`http://localhost:3000${product.image}`} 
                alt={product.name}
                onError={(e) => {
                    e.target.src = 'http://localhost:3000/images/default.jpg';
                }}
            />
            <div className="card__content">
                <h3 className="card__title">{product.name}</h3>
                <span className="card__category">{product.category}</span>
                <p className="card__description">{product.description}</p>
                <div className="card__footer">
                    <span className="card__price">{product.price} ₽</span>
                    <span className={`card__stock ${stockStatus.className}`}>
                        {stockStatus.text}
                    </span>
                </div>
                <div className='card__actions'>
                    <button className='btn btn-edit' onClick={onEdit} title='Редактировать'>Изменить</button>
                    <button className='btn btn-delete' onClick={onDelete} title='Удалить'>Удалить</button>
                </div>
            </div>
        </article>
    );
};

export default ProductCard;