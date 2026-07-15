/**
 * Express middleware to log incoming HTTP requests and response performance metrics.
 */
const requestLogger = (req, res, next) => {
  if (process.env.BYPASS_LOGGER === "true") {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const contentLength = res.get("Content-Length") || 0;

    let statusEmoji = "⚪";
    if (status >= 500) statusEmoji = "🔴";
    else if (status >= 400) statusEmoji = "🟡";
    else if (status >= 300) statusEmoji = "🔵";
    else if (status >= 200) statusEmoji = "🟢";

    console.log(
      `${statusEmoji} [${new Date().toISOString()}] ${method} ${originalUrl} ${status} - ${contentLength}b - ${duration}ms`
    );
  });

  next();
};

export default requestLogger;
