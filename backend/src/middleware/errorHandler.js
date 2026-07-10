/**
 * Global Express error handling middleware.
 * Catches all unhandled exceptions in request pipelines, log details, and standardizes JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  console.error("🔴 Error caught by global handler:", err);

  // Extract status code, defaulting to 500
  const statusCode = err.statusCode || err.status || 500;
  const errorMessage = err.message || "An unexpected server error occurred.";

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    // Provide stack trace in development mode only
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
