const mongodb = require('mongodb');
const dotenv = require('dotenv');

dotenv.config()

mongodb.connect(process.env.CONNECTIONSTRING , {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
  module.exports = client
  const app = require('./app')
  app.listen(process.env.PORT, () => {
    console.log('Server started on port 3000');
  })
})
