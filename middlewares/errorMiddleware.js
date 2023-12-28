const errorHandler = async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: "internal server error",
    error: err.message,
  });
};

module.exports = errorHandler;
