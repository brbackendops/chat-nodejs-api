const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./routes/chat.route.js','./routes/user.route.js']

swaggerAutogen(outputFile, endpointsFiles)
