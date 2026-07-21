export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.errors = null;
  }

  static success(res, message, data = null, meta = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta,
      errors: null,
    });
  }

  static created(res, message, data = null, meta = null) {
    return ApiResponse.success(res, message, data, meta, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
