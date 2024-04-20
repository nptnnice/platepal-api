const { query } = require('../config/db.config')
const statusCode = require('../utils/statusCode')
const JsonResponse = require('../utils/jsonResponse')
const errorMessage = require('../utils/errorMessage')
const foodsResponse = require('../json/foodsResponse.json')

/**
 * /api/getNewFoods
 */
const getNewFoods = async (req, res) => {
  console.log('Calling /api/getNewFoods...')
  try {
    const foods = await query('SELECT * FROM food ORDER BY id DESC')

    console.log('Querying data...')
    const mappedFoods = await Promise.all(
      foods.rows.map(async (food) => {
        const measureUnits = await query(
          `SELECT id, measure_unit_id, gram_per_unit, amount FROM food_measure_unit WHERE food_id = ${food.id}`
        )
        const ingredients = await query(
          `SELECT * FROM food_ingredient WHERE food_id = ${food.id}`
        )
        const ingredientDetails = await Promise.all(
          ingredients.rows.map(async (ingredient) => {
            const details = await query(
              `SELECT * FROM food WHERE id = ${ingredient.ingredient_id}`
            )
            const currentMeasureUnit = await query(
              `SELECT id, measure_unit_id, gram_per_unit, amount FROM food_measure_unit WHERE food_id = ${ingredient.ingredient_id} AND id = ${ingredient.food_measure_unit_id}`
            )
            const measureUnits = await query(
              `SELECT id, measure_unit_id, gram_per_unit, amount FROM food_measure_unit WHERE food_id = ${ingredient.ingredient_id}`
            )
            const nutrients = await query(
              `SELECT nutrient_id, amount FROM food_nutrient WHERE food_id = ${ingredient.ingredient_id}`
            )
            return {
              id: details.rows[0].id,
              name_en: details.rows[0].name_en,
              name_th: details.rows[0].name_th,
              category_id: details.rows[0].category_id,
              image: details.rows[0].image,
              current_measure_unit: currentMeasureUnit.rows[0],
              measure_units: measureUnits.rows,
              nutrients: nutrients.rows,
            }
          })
        )

        const nutrients = await query(
          `SELECT nutrient_id, amount FROM food_nutrient WHERE food_id = ${food.id}`
        )

        return {
          id: food.id,
          name_en: food.name_en,
          name_th: food.name_th,
          category_id: food.category_id,
          image: food.image,
          measure_units: measureUnits.rows,
          ingredients: ingredientDetails,
          nutrients: nutrients.rows,
        }
      })
    )

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, { foods: mappedFoods })
    res.status(statusCode.SUCCESS).json(jsonResponse)
  } catch (error) {
    console.log(error)
    const jsonResponse = new JsonResponse(
      false,
      errorMessage.INTERNAL_SERVER_ERROR,
      null
    )
    res.status(statusCode.INTERNAL_SERVER_ERROR).json(jsonResponse)
  }
}

/**
 * /api/getFoods
 */
const getFoods = async (req, res) => {
  console.log('Calling /api/getFoods...')
  try {
    res.status(statusCode.SUCCESS).json(foodsResponse)
  } catch (error) {
    console.log(error)
    const jsonResponse = new JsonResponse(
      false,
      errorMessage.INTERNAL_SERVER_ERROR,
      null
    )
    res.status(statusCode.INTERNAL_SERVER_ERROR).json(jsonResponse)
  }
}

/**
 * /api/insertUser
 */
const insertUser = async (req, res) => {
  console.log('Calling /api/insertUser...')
  try {
    const {
      id,
      display_name,
      email,
      password,
      dob,
      gender,
      goal_type_id,
      start_weight,
      height,
      target_weight,
      weekly_rate,
      activity_level_id,
      target_date,
      daily_calories,
      created_at,
    } = req.body

    const user = await query(
      `UPSERT INTO public."user" (id, display_name, email, password, dob, gender, goal_type_id, 
        start_weight, height, target_weight, weekly_rate, activity_level_id, target_date, daily_calories, created_at
      ) VALUES (
        '${id}',
        '${display_name}',
        '${email}',
        '${password}',
        '${dob}',
        '${gender}',
        ${goal_type_id},
        ${start_weight},
        ${height},
        ${target_weight},
        ${weekly_rate},
        ${activity_level_id},
        '${target_date}',
        ${daily_calories},
        '${created_at}'
      ) RETURNING *`
    )

    console.log('Successfully inserted data.')
    const jsonResponse = new JsonResponse(true, null, {
      id: user.rows[0].id,
      display_name: user.rows[0].display_name,
      email: user.rows[0].email,
      password: user.rows[0].password,
      dob: user.rows[0].dob,
      gender: user.rows[0].gender,
      goal_type_id: user.rows[0].goal_type_id,
      start_weight: user.rows[0].start_weight,
      height: user.rows[0].height,
      target_weight: user.rows[0].target_weight,
      weekly_rate: user.rows[0].weekly_rate,
      activity_level_id: user.rows[0].activity_level_id,
      target_date: user.rows[0].target_date,
      daily_calories: user.rows[0].daily_calories,
      created_at: user.rows[0].created_at,
    })
    res.status(statusCode.SUCCESS).json(jsonResponse)
  } catch (error) {
    console.log(error)
    const jsonResponse = new JsonResponse(
      false,
      errorMessage.INTERNAL_SERVER_ERROR,
      null
    )
    res.status(statusCode.INTERNAL_SERVER_ERROR).json(jsonResponse)
  }
}

module.exports = {
  getNewFoods,
  getFoods,
  insertUser,
}
