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
        const measureUnitsDetails = await Promise.all(
          measureUnits.rows.map(async (measureUnit) => {
            return {
              food_measure_unit_id: measureUnit.id,
              amount: measureUnit.amount,
              measure_unit_id: measureUnit.measure_unit_id,
              total_gram: measureUnit.amount * measureUnit.gram_per_unit,
              gram_per_unit: measureUnit.gram_per_unit,
            }
          })
        )
        const ingredients = await query(
          `SELECT * FROM food_ingredient WHERE food_id = ${food.id}`
        )
        // -------- ingredient --------
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
            const total_gram =
              ingredient.amount * currentMeasureUnit.rows[0].gram_per_unit
            const nutrients = await query(
              `SELECT nutrient_id, amount FROM food_nutrient WHERE food_id = ${ingredient.ingredient_id}`
            )
            const nutrientAmounts = nutrients.rows.map((nutrient) => {
              return {
                nutrient_id: nutrient.nutrient_id,
                amount: (nutrient.amount * total_gram) / 100.0,
                amount_per_unit: nutrient.amount,
              }
            })

            return {
              id: ingredient.id,
              ingredient_id: details.rows[0].id,
              name_en: details.rows[0].name_en,
              name_th: details.rows[0].name_th,
              category_id: details.rows[0].category_id,
              image: details.rows[0].image,
              amount: ingredient.amount,
              total_gram: total_gram,
              current_measure_unit: {
                food_measure_unit_id: currentMeasureUnit.rows[0].id,
                amount: currentMeasureUnit.rows[0].amount,
                measure_unit_id: currentMeasureUnit.rows[0].measure_unit_id,
                total_gram:
                  currentMeasureUnit.rows[0].amount *
                  currentMeasureUnit.rows[0].gram_per_unit,
                gram_per_unit: currentMeasureUnit.rows[0].gram_per_unit,
              },
              measure_units: measureUnits.rows.map((measureUnit) => {
                return {
                  food_measure_unit_id: measureUnit.id,
                  amount: measureUnit.amount,
                  measure_unit_id: measureUnit.measure_unit_id,
                  total_gram: measureUnit.amount * measureUnit.gram_per_unit,
                  gram_per_unit: measureUnit.gram_per_unit,
                }
              }),
              nutrients: nutrientAmounts,
            }
          })
        )
        // ---------------------------

        const nutrients = await query(
          `SELECT nutrient_id, amount FROM food_nutrient WHERE food_id = ${food.id}`
        )
        const nutrientAmounts = nutrients.rows.map((nutrient) => {
          if (food.category_id < 100) {
            return {
              nutrient_id: nutrient.nutrient_id,
              amount:
                (nutrient.amount * measureUnitsDetails[0].total_gram) / 100.0,
              amount_per_unit: nutrient.amount,
            }
          } else {
            return {
              nutrient_id: nutrient.nutrient_id,
              amount: nutrient.amount,
              amount_per_unit: nutrient.amount,
            }
          }
        })

        return {
          id: food.id,
          name_en: food.name_en,
          name_th: food.name_th,
          category_id: food.category_id,
          image: food.image,
          current_measure_unit: measureUnitsDetails[0],
          measure_units: measureUnitsDetails,
          ingredients: ingredientDetails,
          nutrients: nutrientAmounts,
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
    console.log('Successfully queried data.')
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
      weight_logs,
    } = req.body

    const weightLogsJsonString = JSON.stringify(weight_logs)

    const weeklyRateParam = weekly_rate !== undefined ? weekly_rate : null

    const user = await query(
      `UPSERT INTO public."user" (id, display_name, email, password, dob, gender, goal_type_id, 
        start_weight, height, target_weight, weekly_rate, activity_level_id, target_date, daily_calories, created_at, weight_logs
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
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
        weeklyRateParam,
        activity_level_id,
        target_date,
        daily_calories,
        created_at,
        weightLogsJsonString,
      ]
    )

    const weightLogsObject = JSON.parse(user.rows[0].weight_logs)

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
      weight_logs: weightLogsObject,
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

/**
 * /api/signup
 */
const signup = async (req, res) => {
  console.log('Calling /api/signup...')
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
      weight_logs,
    } = req.body

    const isExist = await isEmailExist(email)
    if (isExist) {
      console.log('Email already exists.')
      const jsonResponse = new JsonResponse(
        false,
        errorMessage.EMAIL_ALREADY_EXISTS,
        null
      )
      res.status(statusCode.SUCCESS).json(jsonResponse)
      return
    }

    const weightLogsJsonString = JSON.stringify(weight_logs)

    const weeklyRateParam = weekly_rate !== undefined ? weekly_rate : null

    const user = await query(
      `UPSERT INTO public."user" (id, display_name, email, password, dob, gender, goal_type_id, 
        start_weight, height, target_weight, weekly_rate, activity_level_id, target_date, daily_calories, created_at, weight_logs
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
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
        weeklyRateParam,
        activity_level_id,
        target_date,
        daily_calories,
        created_at,
        weightLogsJsonString,
      ]
    )

    const weightLogsObject = JSON.parse(user.rows[0].weight_logs)

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
      weight_logs: weightLogsObject,
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

const isEmailExist = async (email) => {
  const user = await query('SELECT * FROM public."user" WHERE email = $1', [
    email,
  ])
  return user.rows.length > 0
}

/**
 * /api/insertFoodLogs
 */
const insertFoodLogs = async (req, res) => {
  console.log('Calling /api/insertFoodLogs...')
  try {
    const { id, user_id, meal_id, rec_date, food_log } = req.body

    const foodLogJsonString = JSON.stringify(food_log)

    let queryText
    if (id) {
      console.log('Updating food log...')
      queryText = `UPDATE public."food_log"
      SET user_id = '${user_id}', meal_id = ${meal_id}, rec_date = '${rec_date}', food_log = '${foodLogJsonString}'
      WHERE id = ${id}
      RETURNING *`
    } else {
      console.log('Inserting new food log...')
      queryText = `INSERT INTO public."food_log" (user_id, meal_id, rec_date, food_log) VALUES (
        '${user_id}',
        ${meal_id},
        '${rec_date}',
        '${foodLogJsonString}'
      ) RETURNING *`
    }

    const foodLog = await query(queryText)

    console.log('Successfully inserted data.')
    const jsonResponse = new JsonResponse(true, null, {
      id: foodLog.rows[0].id,
      user_id: foodLog.rows[0].user_id,
      meal_id: foodLog.rows[0].meal_id,
      rec_date: foodLog.rows[0].rec_date,
      food_log: JSON.parse(foodLog.rows[0].food_log),
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

/**
 * /api/getFoodLogsInDay
 */
const getFoodLogsInDay = async (req, res) => {
  console.log('Calling /api/getFoodLogs...')
  try {
    const { user_id, date } = req.body

    const foodLogs = await query(
      'SELECT * FROM food_log WHERE user_id = $1 AND rec_date = $2',
      [user_id, date]
    )

    const parsedFoodLogs = foodLogs.rows.map((foodLog) => {
      return {
        id: foodLog.id,
        meal_id: foodLog.meal_id,
        rec_date: foodLog.rec_date,
        food_log: JSON.parse(foodLog.food_log),
      }
    })

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, {
      food_logs: parsedFoodLogs,
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

/**
 * /api/getFoodLogsInMeal
 */
const getFoodLogsInMeal = async (req, res) => {
  console.log('Calling /api/getFoodLogsInMeal...')
  try {
    const { user_id, date, meal_id } = req.body

    const foodLogs = await query(
      'SELECT * FROM food_log WHERE user_id = $1 AND rec_date = $2 AND meal_id = $3',
      [user_id, date, meal_id]
    )

    const parsedFoodLogs = foodLogs.rows.map((foodLog) => {
      return {
        id: foodLog.id,
        meal_id: foodLog.meal_id,
        rec_date: foodLog.rec_date,
        food_log: JSON.parse(foodLog.food_log),
      }
    })

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, {
      food_logs: parsedFoodLogs,
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

/**
 * /api/removeFoodFromLog
 */
const removeFoodFromLog = async (req, res) => {
  console.log('Calling /api/removeFoodFromLog...')
  try {
    const { id } = req.body

    const idBigInt = BigInt(id)

    await query('DELETE FROM public."food_log" WHERE id = $1', [idBigInt])

    console.log('Successfully removed data.')
    const jsonResponse = new JsonResponse(true, null, null)
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
 * /api/login
 */
const login = async (req, res) => {
  console.log('Calling /api/login...')
  try {
    const { email } = req.body

    const user = await query('SELECT * FROM public."user" WHERE email = $1', [
      email,
    ])

    if (user.rows.length === 0) {
      console.log('User not found.')
      const jsonResponse = new JsonResponse(
        false,
        errorMessage.USER_NOT_FOUND,
        null
      )
      res.status(statusCode.SUCCESS).json(jsonResponse)
      return
    }

    const weightLogs = JSON.parse(user.rows[0].weight_logs)

    console.log('Successfully queried data.')
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
      weight_logs: weightLogs,
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

/**
 * /api/updatePassword
 */
const updatePassword = async (req, res) => {
  console.log('Calling /api/updatePassword...')
  try {
    const { email, password } = req.body

    await query('UPDATE public."user" SET password = $1 WHERE email = $2', [
      password,
      email,
    ])

    console.log('Successfully updated data.')
    const jsonResponse = new JsonResponse(true, null, null)
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
 * /api/getFoodLogs
 */
const getFoodLogs = async (req, res) => {
  console.log('Calling /api/getFoodLogs...')
  try {
    const { user_id } = req.body

    const foodLogs = await query(
      'SELECT * FROM public."food_log" WHERE user_id = $1',
      [user_id]
    )

    const parsedFoodLogs = foodLogs.rows.map((foodLog) => {
      return {
        id: foodLog.id,
        user_id: foodLog.user_id,
        meal_id: foodLog.meal_id,
        rec_date: foodLog.rec_date,
        food_log: JSON.parse(foodLog.food_log),
      }
    })

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, {
      food_logs: parsedFoodLogs,
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

/**
 * /api/insertUserRecipe
 */
const insertUserRecipe = async (req, res) => {
  console.log('Calling /api/insertUserRecipe...')
  try {
    const { id, user_id, recipe } = req.body

    const recipeJsonString = JSON.stringify(recipe)

    let queryText
    if (id) {
      console.log('Updating recipe...')
      queryText = `UPDATE public."user_recipe"
        SET user_id = '${user_id}', recipe = '${recipeJsonString}'
        WHERE id = ${id}
        RETURNING *`
    } else {
      console.log('Inserting new recipe...')
      queryText = `INSERT INTO public."user_recipe" (user_id, recipe) VALUES (
        '${user_id}',
        '${recipeJsonString}'
      ) RETURNING *`
    }

    const userRecipe = await query(queryText)

    const parsedRecipe = JSON.parse(userRecipe.rows[0].recipe)

    console.log('Successfully inserted data.')
    const jsonResponse = new JsonResponse(true, null, {
      id: userRecipe.rows[0].id,
      user_id: userRecipe.rows[0].user_id,
      recipe: parsedRecipe,
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

/**
 * /api/removeUserRecipe
 */
const removeUserRecipe = async (req, res) => {
  console.log('Calling /api/removeUserRecipe...')
  try {
    const { id } = req.body

    const idBigInt = BigInt(id)

    await query('DELETE FROM public."user_recipe" WHERE id = $1', [idBigInt])

    console.log('Successfully removed data.')
    const jsonResponse = new JsonResponse(true, null, null)
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
 * /api/getUserRecipes
 */
const getUserRecipes = async (req, res) => {
  console.log('Calling /api/getUserRecipes...')
  try {
    const { user_id } = req.body

    const userRecipes = await query(
      'SELECT * FROM public."user_recipe" WHERE user_id = $1',
      [user_id]
    )

    const parsedUserRecipes = userRecipes.rows.map((userRecipe) => {
      return {
        id: userRecipe.id,
        user_id: userRecipe.user_id,
        recipe: JSON.parse(userRecipe.recipe),
      }
    })

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, {
      user_recipes: parsedUserRecipes,
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

/**
 * /api/insertChatbotHistory
 */
const insertChatbotHistory = async (req, res) => {
  console.log('Calling /api/insertChatbotHistory...')
  try {
    const { chatbot_history } = req.body

    // Prepare query
    const chatbotHistory = Promise.all(
      chatbot_history.map(async (history) => {
        const values = [
          history.user_id,
          history.message,
          history.sender,
          history.timestamp,
        ]
        const queryText =
          'INSERT INTO public."chatbot_history" (user_id, message, sender, timestamp) VALUES ($1, $2, $3, $4) RETURNING *'
        return await query(queryText, values)
      })
    )

    console.log('Successfully inserted data.')
    const jsonResponse = new JsonResponse(true, null, null)

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
 * /api/getChatbotHistory
 */
const getChatbotHistory = async (req, res) => {
  console.log('Calling /api/getChatbotHistory...')
  try {
    const { user_id } = req.body

    const chatbotHistory = await query(
      'SELECT * FROM public."chatbot_history" WHERE user_id = $1',
      [user_id]
    )

    console.log('Successfully queried data.')
    const jsonResponse = new JsonResponse(true, null, {
      chatbot_history: chatbotHistory.rows,
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

/**
 * /api/clearChatbotHistory
 */
const clearChatbotHistory = async (req, res) => {
  console.log('Calling /api/clearChatbotHistory...')
  try {
    const { user_id } = req.body

    await query('DELETE FROM public."chatbot_history" WHERE user_id = $1', [
      user_id,
    ])

    console.log('Successfully cleared data.')
    const jsonResponse = new JsonResponse(true, null, null)

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
  insertChatbotHistory,
  getChatbotHistory,
  clearChatbotHistory,
}
