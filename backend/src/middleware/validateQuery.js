// Same shape as validate, but for the query string. Express 5 makes req.query
// a getter, so the parsed result is attached as req.validatedQuery rather
// than replacing it.
function validateQuery(schema) {
  return function validateRequestQuery(req, res, next) {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const fields = {};

      result.error.issues.forEach((issue) => {
        const key = issue.path.join('.') || '_';
        if (!fields[key]) fields[key] = issue.message;
      });

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
    }

    req.validatedQuery = result.data;
    next();
  };
}

module.exports = validateQuery;
