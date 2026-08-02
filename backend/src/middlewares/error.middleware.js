// Middleware bắt lỗi 4 tham số — phải đặt sau tất cả routes.
export default function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
}