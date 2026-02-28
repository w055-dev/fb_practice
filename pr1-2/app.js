const express=require('express');
const app=express();
const port=3000;

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));

let products=[
    {id: 1, name: 'Удобные офисные очки', price: '499'},
    {id: 2, name: 'Стильная шляпа', price: '899'},
    {id: 3, name: 'Курительная трубка', price: '299'}
];

app.get('/products', (req,res) =>{
    res.json(products);
});

app.get('/products/:id', (req,res) =>{
    const product=products.find(p=>p.id == req.params.id);
    res.json(product);
});

app.post('/products', (req,res) =>{
    const {name, price} = req.body;
    const newProduct = {
        id: Date.now(),
        name,
        price: Number(price)
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/products/:id', (req,res) => {
    const product = products.find(p=>p.id == req.params.id);
    product.name = req.body.name;
    product.price = req.body.price;
    res.json(product);
});

app.delete('/products/:id', (req, res) => {
    products = products.filter(p => p.id != req.params.id);
    res.json({message : "Товар удален"});
})

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});