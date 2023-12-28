require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  })
  .then(() => {
    console.log(`db is connected`);
  })
  .catch((err) => {
    console.log(`error connecting to db`, err);
  });
