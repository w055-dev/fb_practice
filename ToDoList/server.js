const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const reminders =new Map();
const PORT = 3001;

const vapidKeys = {
    publicKey: 'BFOkI_xuB0nfEeNcMugHQ56XNM3qNTOkuThGWDx2cXlSu7t4uCAnSxY8iJlcxQxu0tF8Req8CBcmQa5Gq8Fnk6E',
    privateKey: 'hRKvszZWGjRBlYG1pY1TyynjBJtfAKZJuZ_Q6eUP3_Y'
};
webpush.setVapidDetails(
    'mailto:dsa642311@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) =>{
    console.log('Клиент подключен', socket.id);
    socket.on('newTask', (task) =>{
        io.emit('taskAdded', task);

        const payload = JSON.stringify({
            title: "Новая задача",
            body: task.text
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error', err));
        });
    });
    socket.on('newReminder', (reminder) =>{
        const { id, text, reminderTime} = reminder;
        const delay = reminderTime - Date.now();
        if (delay <= 0) {
            console.log('did not save');
            return;
        }
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: 'Напоминание',
                body: text,
                reminderId: id
            });
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err =>
                    console.error('Push error:', err));
            });
            const etc = reminders.get(id);
            if (etc){
                reminders.set(id, {...etc, timeoutId: null, snoozed: true});
            }
        }, delay);
        reminders.set(id, {timeoutId, text, reminderTime, snoozed: false});
    });
    socket.on('disconnect', () => {
        console.log('Клиент отключен', socket.id);
    });
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some((sub) => sub.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
    }
    res.status(201).json({message : 'Подписка сохранена'});
})

app.post('/unsubscribe', (req, res) => {
    const endpoint = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({message : 'Подписка удалена'});
})

app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    const newDelay = 5 * 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание отложено',
            body: reminder.text,
            reminderId: reminderId
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
    }, newDelay);
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay,
        snoozed: true
    });
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

server.listen(PORT, () =>{
    console.log(`Сервер запущен на http://localhost:${PORT}`);
})