import app from './src/index.js'
const PORT = 3001

app.listen(PORT, () => {
    console.log(`Server started on address ${process.env.SERVER_ADDRESS}`)
})
