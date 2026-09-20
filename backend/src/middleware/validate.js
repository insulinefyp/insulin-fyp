function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields = {};

      result.error.issues.forEach((issue) => {
        const key = issue.path.join('.') || '_';
        if (!fields[key]) fields[key] = issue.message;
      });

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
    }

    req.body = result.data;
    next();
  };
}

module.exports = validate;
