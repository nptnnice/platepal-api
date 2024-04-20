const { Router } = require('express')
const router = Router()

const {
  getNewFoods,
  getFoods,
  insertUser,
} = require('../controllers/index.controller')

router.get('/', (req, res) => {
  res.json({
    message_response: 'Hello World',
  })
})

router.get('/api/getNewFoods', getNewFoods)
router.get('/api/getFoods', getFoods)
router.post('/api/insertUser', insertUser)

module.exports = router
