const express = require('express')
const app = express()
const port = 8080

//middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

//routes
app.use(require('./routes/index'))

app.listen(process.env.PORT || port)

console.log(`Server running on port ${port}`)
