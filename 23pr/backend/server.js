const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || '1';

app.get("/", (req,res) => {
    res.json({
        message: "Common response from backend",
        port: PORT,
        server: SERVER_ID
    });
});

app.listen(PORT, () =>{
    console.log(`Server running on ${PORT}`);
});