const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static('public/images'));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Детективный магазин API',
            version: '1.0.0'
        },
        servers: [
            { url: `http://localhost:${port}` }
        ],
        components: {
            schemas: {
                 User: {
                    type: 'object',
                    required: ['id', 'name', 'email'],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Иван Петров' },
                        email: { type: 'string', format: 'email', example: 'ivan@example.com' },
                        role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
                        createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' }
                    }
                },
                Product: {
                    type: 'object',
                    required: ['id', 'name', 'category', 'description', 'price', 'stock'],
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        stock: { type: 'integer' },
                        image: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./server.js'],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions), {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
}));

let products = [
    { id: 1, name: 'Удобные очки', category: 'Аксессуар', description: 'Очки для идеального наблюдения за подозреваемыми', price: 499, stock: 7, image: '/images/ochki.jpg' },
    { id: 2, name: 'Шляпа детектива', category: 'Одежда', description: 'Стильная шляпа детектива', price: 899, stock: 1, image: '/images/shlyapa.jpg' },
    { id: 3, name: 'Курительная трубка', category: 'Курительная принадлежность', description: 'Трубка для размышлений над самой запутанной уликой', price: 299, stock: 3, image: '/images/trubka.jpg' },
    { id: 4, name: 'Монокль', category: 'Аксессуар', description: 'Монокль с золотой цепью', price: 1299, stock: 3, image: '/images/monocle.jpg' }
];

let users = [
    { id: 1, name: 'Иван Петров', email: 'ivan@example.com', role: 'user', createdAt: new Date().toISOString() },
    { id: 2, name: 'Анна Сидорова', email: 'anna@example.com', role: 'admin', createdAt: new Date().toISOString() }
];

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => res.json(products));
/*
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Получить всех пользователей
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get('/api/users', (req, res) => res.json(users));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    product ? res.json(product) : res.status(404).json({ message: 'Товар не найден' });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               image: { type: string }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               image: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    Object.assign(product, req.body);
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/products/:id', (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    products.length < initialLength ? res.json({ message: 'Товар удален' }) : res.status(404).json({ message: 'Товар не найден' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api/products`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});