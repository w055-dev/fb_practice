const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static('public/images'));

const ROLES = {
    GUEST: 'guest',
    USER: 'user',
    SELLER: 'seller',
    ADMIN: 'admin'
};

const adminHash = bcrypt.hashSync('admin123', 10);
const sellerHash = bcrypt.hashSync('seller123', 10);
const userHash = bcrypt.hashSync('user123', 10);

let users = [
    {
        id: nanoid(),
        name: 'Average Joe(user)',
        email: 'avjoe@example.com',
        password: userHash,
        role: ROLES.USER,
        isBlocked: false
    },
    {
        id: nanoid(),
        name: 'Продавец',
        email: 'seller@example.com',
        password: sellerHash,
        role: ROLES.SELLER,
        isBlocked: false
    },
    {
        id: 1,
        name: 'Администратор',
        email: 'admin@example.com',
        password: adminHash,
        role: ROLES.ADMIN,
        isBlocked: false
    }
];

let products = [
    { id: 1, name: 'Удобные очки', category: 'Аксессуар', description: 'Очки для идеального наблюдения за подозреваемыми', price: 499, stock: 7, image: '/images/ochki.jpg' },
    { id: 2, name: 'Шляпа детектива', category: 'Одежда', description: 'Стильная шляпа детектива', price: 899, stock: 1, image: '/images/shlyapa.jpg' },
    { id: 3, name: 'Курительная трубка', category: 'Курительная принадлежность', description: 'Трубка для размышлений над самой запутанной уликой', price: 299, stock: 3, image: '/images/trubka.jpg' },
    { id: 4, name: 'Монокль', category: 'Аксессуар', description: 'Монокль с золотой цепью', price: 1299, stock: 3, image: '/images/monocle.jpg' }
];
let refreshTokens = [];

const JWT_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function generateTokens(user) {
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
    
    refreshTokens.push({
        token: refreshToken,
        userId: user.id,
    });
    
    return { accessToken, refreshToken };
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: "Токен не предоставлен" });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Недействительный или просроченный токен" });
        }
        req.user = user;
        next();
    });
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Требуется аутентификация" });
        }
        
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        
        if (user.isBlocked) {
            return res.status(403).json({ error: "Пользователь заблокирован" });
        }
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ 
                error: "Недостаточно прав для выполнения операции",
                requiredRoles: allowedRoles,
                userRole: user.role
            });
        }
        
        next();
    };
}

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
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'abc123' },
                        name: { type: 'string', example: 'Иван Петров' },
                        email: { type: 'string', example: 'ivan@example.com' },
                        role: { type: 'string', enum: ['user', 'seller', 'admin'] },
                        isBlocked: { type: 'boolean', example: false }
                    }
                },
                Product: {
                    type: 'object',
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
                        error: { type: 'string' }
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

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    });
    next();
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Иван Петров
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ivan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mypassword123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь с таким email уже существует
 */
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Имя, email и пароль обязательны" });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }
    
    const newUser = {
        id: nanoid(),
        name,
        email,
        password: await hashPassword(password),
        role: ROLES.USER,
        isBlocked: false
    };
    
    users.push(newUser);
    
    const userResponse = { ...newUser };
    delete userResponse.password;
    
    res.status(201).json(userResponse);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверный пароль или пользователь заблокирован
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    if (user.isBlocked) {
        return res.status(401).json({ error: "Пользователь заблокирован" });
    }
    
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (isPasswordValid) {
        const tokens = generateTokens(user);
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: userResponse
        });
    } else {
        res.status(401).json({ error: "Неверный пароль" });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить токены
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Refresh токен не предоставлен
 *       401:
 *         description: Недействительный refresh токен
 *       403:
 *         description: Токен истек
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh токен не предоставлен" });
    }
    
    const storedToken = refreshTokens.find(rt => rt.token === refreshToken);
    if (!storedToken) {
        return res.status(401).json({ error: "Недействительный refresh токен" });
    }
    
    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) {
            refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
            return res.status(403).json({ error: "Refresh токен истек" });
        }
        
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        if (user.isBlocked) {
            refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
            return res.status(401).json({ error: "Пользователь заблокирован" });
        }
        
        refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
        const tokens = generateTokens(user);
        res.status(200).json(tokens);
    });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недействительный токен
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.status(200).json(userResponse);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 */
app.get('/api/users', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    const usersResponse = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
    res.json(usersResponse);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const { password, ...updateData } = req.body;
    users[userIndex] = {
        ...users[userIndex],
        ...updateData
    };
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь заблокирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    users[userIndex].isBlocked = true;
    // Удаление всех refresh токенов пользователя
    refreshTokens = refreshTokens.filter(rt => rt.userId !== req.params.id);
    res.json({ message: 'Пользователь заблокирован' });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Токен не предоставлен
 */
app.get('/api/products', authenticateToken, authorize(ROLES.USER, ROLES.SELLER, ROLES.ADMIN), (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Токен не предоставлен
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authenticateToken, authorize(ROLES.USER, ROLES.SELLER, ROLES.ADMIN), (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 */
app.post('/api/products', authenticateToken, authorize(ROLES.SELLER, ROLES.ADMIN), (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: 'Заполните все поля' });
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
 *   put:
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authenticateToken, authorize(ROLES.SELLER, ROLES.ADMIN), (req, res) => {
    const productIndex = products.findIndex(p => p.id == req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    products[productIndex] = {
        ...products[productIndex],
        ...req.body,
        id: products[productIndex].id
    };
    res.json(products[productIndex]);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Товар удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authenticateToken, authorize(ROLES.ADMIN), (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    if (products.length < initialLength) {
        res.json({ message: 'Товар удален' });
    } else {
        res.status(404).json({ error: 'Товар не найден' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});