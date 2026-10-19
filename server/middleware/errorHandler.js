export const notFound = (req, res, next) => {
  const error = new Error('The requested item or page could not be found.');
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  let friendlyMessage = err.message || 'An unexpected error occurred. Please try again.';
  if (err.name === 'CastError') {
    friendlyMessage = 'The requested item or record could not be found.';
  } else if (err.code === 11000) {
    friendlyMessage = 'A record with this information already exists. Please use unique details.';
  } else if (err.name === 'ValidationError') {
    friendlyMessage = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
  });
};
