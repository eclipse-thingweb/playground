const express = require('express')
const port = 5000

const app = express()

//Middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use('/', express.static('./dist/'))

app.listen(port, () => console.log(`Server started on port ${port}`))