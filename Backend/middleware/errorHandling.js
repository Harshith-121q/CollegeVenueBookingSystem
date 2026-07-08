// errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.log("🔴 Error:", err.message);

  // ✅ Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(e => e.message);

    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  // ✅ Cast Error
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
      error: `Invalid value "${err.value}" for field "${err.path}"`,
    });
  }

  // ✅ Duplicate Key Error
  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return res.status(409).json({
      message: "Duplicate field error",
      error: `${field} "${value}" already exists`,
    });
  }

  // ✅ Default Error
  res.status(500).json({
    message: "Server error",
  });
};