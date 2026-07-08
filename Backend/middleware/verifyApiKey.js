export const verifyApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers["X-API-KEY"];

    if (!apiKey || apiKey !== process.env.AI_API_KEY) {
      return res.status(401).json({ message: "Invalid or missing API key" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
