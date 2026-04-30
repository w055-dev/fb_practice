const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req,res) => {
    res.json({
        message: "Common response from backend",
        port: PORT
    });
});

app.listen(PORT, () =>{
    console.log(`Server running on ${PORT}`);
});