const dotenv = require("dotenv");
require('dotenv').config();
const path = require("path");

// Load env file
dotenv.config({
  path:
    process.env.NODE_ENV === "test"
      ? path.resolve(__dirname, "../.env.test")
      : path.resolve(__dirname, ".env"),
});

const connectDB = require("./src/config/db");
const app = require("./src/app");   // ✅ Import app FIRST
      // Then require cors

                  // ✅ Now app exists

const mongoUri = process.env.MONGODB_URI;

connectDB(mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));


