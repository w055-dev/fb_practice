const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static('public/images'));

let products = [
    { 
        id: 1, 
        name: 'Удобные очки', 
        category: 'Аксессуар',
        description: 'Очки для идеального наблюдения за подозреваемыми',
        price: 499,
        stock: 7,
        image: '/images/ochki.jpg'
    },
    { 
        id: 2, 
        name: 'Шляпа детектива', 
        category: 'Одежда',
        description: 'Стильная шляпа детектива',
        price: 899,
        stock: 1,
        image: '/images/shlyapa.jpg'
    },
    { 
        id: 3, 
        name: 'Курительная трубка', 
        category: 'Курительная принадлежность',
        description: 'Трубка для размышлений над самой запутанной уликой',
        price: 299,
        stock: 3,
        image: '/images/trubka.jpg'
    },
    {
        id: 4,
        name : "Монокль",
        category: 'Аксессуар',
        description: 'Монокль с золотой цепью',
        price: 1299,
        stock: 3,
        image: '/images/monocle.jpg'
    }
];

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Товар не найден' });
    }
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    const newProduct = {
        id: Date.now(),
        name,
        category,
        description,
        price: Number(price),
        stock: Number(stock),
        image: image || '/images/default.jpg'
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (product) {
        Object.assign(product, req.body);
        res.json(product);
    } else {
        res.status(404).json({ message: 'Товар не найден' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    
    if (products.length < initialLength) {
        res.json({ message: "Товар успешно удален" });
    } else {
        res.status(404).json({ message: 'Товар не найден' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`API доступно по адресу http://localhost:${port}/api/products`);
});