const { Router } = require('express')
const router = Router()

const {
  getNewFoods,
  getFoods,
  insertUser,
  insertFoodLogs,
  getFoodLogsInDay,
  getFoodLogsInMeal,
  removeFoodFromLog,
  login,
  updatePassword,
  getFoodLogs,
  insertUserRecipe,
  removeUserRecipe,
  getUserRecipes,
  signup,
} = require('../controllers/index.controller')

router.get('/', (req, res) => {
  res.json({
    message_response: 'Hello World',
  })
})

router.get('/api/getNewFoods', getNewFoods)
router.get('/api/getFoods', getFoods)
router.post('/api/insertUser', insertUser)
router.post('/api/insertFoodLogs', insertFoodLogs)
router.post('/api/getFoodLogsInDay', getFoodLogsInDay)
router.post('/api/getFoodLogsInMeal', getFoodLogsInMeal)
router.post('/api/removeFoodFromLog', removeFoodFromLog)
router.post('/api/login', login)
router.post('/api/updatePassword', updatePassword)
router.post('/api/getFoodLogs', getFoodLogs)
router.post('/api/insertUserRecipe', insertUserRecipe)
router.post('/api/removeUserRecipe', removeUserRecipe)
router.post('/api/getUserRecipes', getUserRecipes)
router.post('/api/signup', signup)

module.exports = router
