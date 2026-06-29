export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const payload = {
    error: {
      message: status === 500 ? 'Erro interno do servidor.' : err.message,
      details: err.details || undefined
    }
  };

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json(payload);
}
