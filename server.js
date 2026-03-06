const express = require("express")
const identify = require("./identifyController")

const app = express()

app.use(express.json())

app.post("/identify", identify)

app.listen(3000, () => {
  console.log("Server running on port 3000")
})