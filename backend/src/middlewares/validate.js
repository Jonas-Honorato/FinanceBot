import { ApiError } from '../utils/apiError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      throw new ApiError(400, 'Dados inválidos.', error.details.map((detail) => detail.message));
    }

    req[source] = value;
    next();
  };
}
