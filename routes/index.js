const { Router } = require('express')
const router = Router()

const { getFoods } = require('../controllers/index.controller')

router.get('/getFoods', getFoods)

module.exports = router
