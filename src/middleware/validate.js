const { sendError } = require("../utils/sendResponse");

module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!result.success) {
    const first = result.error.issues[0];
    return sendError(res, 400, `${first.path.join(".")}: ${first.message}`);
  }
  req.body = result.data.body !== undefined ? result.data.body : req.body;
  req.params = result.data.params !== undefined ? result.data.params : req.params;
  req.query = result.data.query !== undefined ? result.data.query : req.query;
  next();
};