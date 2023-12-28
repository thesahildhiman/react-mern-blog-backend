require("dotenv").config();
require("./config/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const blogRoutes = require("./routes/blog");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/blog", blogRoutes);

app.get("/", function (req, res) {
  res.json({ message: "api is working" });
});

const port = 8000;
app.listen(port, () => {
  console.log(`Starting at ${port}`);
});
