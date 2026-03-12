const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

let users = [];
let products = [];
let refreshTokens = [];

const JWT_SECRET = "access_secret";
const REFRESH_SECRET= "refresh_secret";
const ACCESS_EXPIRES_IN = "5m";
const REFRESH_EXPIRES_IN = "5m";

function findUserByEmailOr404(email, res) {
  const user = users.find(u => u.email === email);
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return null;
  }
  return user;
}

function findUserByIdOr404(id, res) {
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return null;
  }
  return user;
}

function findProductByIdOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Товар не найден" });
    return null;
  }
  return product;
}

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateTokens(user){
  const accessToken=jwt.sign(
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    },
    JWT_SECRET,
    {expiresIn: ACCESS_EXPIRES_IN}
  );
  const refreshToken=jwt.sign(
    {
      id: user.id
    },
    REFRESH_SECRET,
    {expiresIn: REFRESH_EXPIRES_IN}
  );
  refreshTokens.push({
    token: refreshToken,
    userId: user.id,
  });
  return {accessToken, refreshToken};
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

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Products/Auth API',
      version: '1.0.0',
      description: 'API для управления товарами и аутентификации пользователей',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./auth.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     description: Создает нового пользователя с хешированным паролем
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
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mypassword123456
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: abc123def456
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 first_name:
 *                   type: string
 *                   example: Иван
 *                 last_name:
 *                   type: string
 *                   example: Иванов
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь с таким email уже существует
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: "Email, пароль, имя и фамилия обязательны для заполнения" });
  }
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }
  
  const newUser = {
    id: nanoid(),
    email: email,
    first_name: first_name,
    last_name: last_name,
    password: await hashPassword(password)
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
 *     summary: Вход пользователя в систему
 *     description: Проверяет email и пароль пользователя, возвращает JWT токен
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
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mypassword123456
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
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны для заполнения" });
  }
  
  const user = findUserByEmailOr404(email, res);
  if (!user) return;
  
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (isPasswordValid) {
    const tokens = generateTokens(user);
    res.status(200).json({ tokens });
  } else {
    res.status(401).json({ error: "Неверный пароль" });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить токены
 *     description: Получить refresh-токен и генерация новой пары access и refresh токенов
 *     tags: [Auth]
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - refreshToken
 *            properties:
 *              refreshToken:
 *                type: string
 *                description: Refresh токен
 *                example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                accessToken:
 *                  type: string
 *                  example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  *                refreshToken:
  *                 type: string
  *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Refresh токен не предоставлен
 *       401:
 *         description: Недействительный refresh токен
 *       403:
 *         description: Токен истек или недействителен
 *       404:
 *         description: Пользователь не найден
 */

app.post('/api/auth/refresh', (req,res) =>{
  const {refreshToken} = req.body;
  if (!refreshToken){
    return res.status(400).json({error: "Refresh токен не предоставлен"});
  }
  const storedToken = refreshTokens.find(rt => rt.token === refreshToken);
  if (!storedToken){
    return res.status(401).json({error: "Недействительный refresh токен"});
  }

  jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
    
    if (err) {
      refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
      return res.status(403).json({ error: "Недействительный refresh токен" });
    }

    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      refreshTokens = refreshTokens.filter(rt => rt.token !== refreshToken);
      return res.status(404).json({ error: "Пользователь не найден" });
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
 *     description: Возвращает данные авторизованного пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недействительный или просроченный токен
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = findUserByIdOr404(req.user.id, res);
  if (!user) return;
  
  const userResponse = { ...user };
  delete userResponse.password;
  
  res.status(200).json(userResponse);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     description: Добавляет новый товар в каталог
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: iPhone 17pro
 *               category:
 *                 type: string
 *                 example: Электроника
 *               description:
 *                 type: string
 *                 example: Новейший смартфон от Apple
 *               price:
 *                 type: number
 *                 example: 899.99
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *       400:
 *         description: Некорректные данные
 */
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;
  
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Название, категория, описание и цена обязательны для заполнения" });
  }
  
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: "Цена должна быть положительным числом" });
  }
  
  const newProduct = {
    id: nanoid(),
    title: title,
    category: category,
    description: description,
    price: price
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     description: Возвращает массив всех товаров в каталоге
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 */
app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     description: Возвращает один товар по его идентификатору (защищенный маршрут)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недействительный или просроченный токен
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductByIdOr404(req.params.id, res);
  if (!product) return;
  
  res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар
 *     description: Полностью обновляет все поля товара (защищенный маршрут)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недействительный или просроченный токен
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductByIdOr404(req.params.id, res);
  if (!product) return;
  
  const { title, category, description, price } = req.body;
  
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "Название, категория, описание и цена обязательны для заполнения" });
  }
  
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: "Цена должна быть положительным числом" });
  }
  
  product.title = title;
  product.category = category;
  product.description = description;
  product.price = price;
  
  res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Удаляет товар по его идентификатору (защищенный маршрут)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар успешно удален
 *       401:
 *         description: Токен не предоставлен
 *       403:
 *         description: Недействительный или просроченный токен
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  
  products.splice(productIndex, 1);
  res.status(200).json({ message: "Товар успешно удален" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});