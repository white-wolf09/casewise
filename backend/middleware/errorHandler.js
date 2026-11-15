export function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError' || err.errors) {
    return res.status(400).json({ errors: err.errors || { general: err.message } });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: err.message || 'Internal server error',
    errors: { form: err.message || 'Internal server error' }
  });
}

export default errorHandler;
