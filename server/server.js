const dotenv = require("dotenv");
const cors = require('cors');
app.use(cors());
const path = require("path");
dotenv.config({
  path: process.env.NODE_ENV === "test" 
    ? path.resolve(__dirname, "../.env.test") 
    : path.resolve(__dirname, "../.env"),
});

const connectDB = require("./src/config/db");
const app = require("./src/app");

const mongoUri = process.env.MONGO_URI;
connectDB(mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
