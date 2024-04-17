const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    'postgresql://pakamon:CLmO7X-MqJcZYjzrN__PNw@platepal-6560.6xw.aws-ap-southeast-1.cockroachlabs.cloud:26257/platepal?sslmode=verify-full',
})

module.exports = {
  query: (text, callback) => {
    return pool.query(text, callback)
  },
}
