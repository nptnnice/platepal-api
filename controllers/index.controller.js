const { query } = require('../config/db.config')

const getFoods = async (req, res) => {
  try {
    const response = await query('SELECT * FROM category')
    res.status(200).json(response.rows)
  } catch (error) {
    console.log(error)
    res.send('Error: ' + error)
  }
}

module.exports = {
  getFoods,
}
