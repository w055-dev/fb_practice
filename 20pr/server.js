const mongoose = require('mongoose');
const express = require('express');
const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/databaseforfibr',)
    .then(() => console.log('Успешно подключен к бд'))
    .catch(err => console.log('Ошибка подключения к бд', err));

const userSchema = new mongoose.Schema({
    id : {type: Number, unique: true},
    first_name : {type: String},
    last_name: {type: String},
    age: {type: Number},
});
const User = mongoose.model('User',userSchema);

app.post('/api/users', async (req,res) =>{
    try{
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch(err){
        res.status(400).send(err.message);
    }
});

app.get('/api/users', async (req,res) => {
    try{
        const users = await User.find();
        res.send(users)
    } catch(err){
        res.status(500).send(err.message);
    }
})

app.get('/api/users/:id', async (req,res) => {
    try{
        const user = await User.find({id: req.params.id});
        if (!user){
            res.send(404).message('User not found');
        }
        res.send(user);
    } catch(err){
        res.status(400).send(err.message);
    }
})

app.patch('/api/users/:id', async (req,res) => {
    try{
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true}
        );
        if (!user){
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch(err){
        res.status(400).send(err.message);
    }
})

app.delete('/api/users/:id', async (req,res) =>{
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user){
            return res.status(404).send('User not found');
        }
        res.send(user);
    } catch(err){
        res.status(500).send(err.message);
    }
})

app.listen(3000, () =>{
    console.log('server is running on http://localhost:3000');
});