const jwt = require("jsonwebtoken");

const checkAuth = async (req, res, next) => {
  const authToken = req.cookies.authToken;
  const refreshToken = req.cookies.refreshToken;

  if (!authToken || !refreshToken) {
    return res.status(401).json({ message: "authentication failed" });
  }

  jwt.verify(authToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        (refreshErr, refreshDecoded) => {
          if (refreshErr) {
            return res.status(401).json({ message: "authentication failed" });
          } else {
            const newAuthToken = jwt.sign(
              { userId: refreshDecoded.userId },
              process.env.JWT_SECRET,
              { expiresIn: "10m" }
            );
            const newRefreshToken = jwt.sign(
              { userId: refreshDecoded.userId },
              process.env.JWT_REFRESH_SECRET,
              { expiresIn: "40m" }
            );

            res.cookie("authToken", newAuthToken, { httpOnly: true });
            res.cookie("refreshToken", newRefreshToken, { httpOnly: true });
            req.userId = refreshDecoded.userId;
            next();
          }
        }
      );
    } else {
      req.userId = decoded.userId;
      next();
    }
  });
};

module.exports = checkAuth;
