const app = require('./app');

const PORT = Number(app.get('PORT'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})



