const { Router } = require('express')
const router = Router()

const { getNewFoods, getFoods } = require('../controllers/index.controller')

router.get('/', (req, res) => {
  res.json({
    message_response: 'Hello World',
  })
})

router.get('/api/getNewFoods', getNewFoods)
router.get('/api/getFoods', getFoods)

module.exports = router
