/**
 * 全局错误处理中间件
 * 
 * 功能说明：
 * 1. 捕获所有未处理的错误
 * 2. 统一错误响应格式
 * 3. 记录错误日志
 * 4. 区分不同类型错误（客户端错误、服务器错误）
 * 
 * 使用方式：
 * app.use(errorHandler);
 * 必须放在所有路由之后！
 */

/**
 * 错误处理中间件主函数
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
function errorHandler(err, req, res, next) {
  console.error('');
  console.error('==========================================');
  console.error('  发生错误！');
  console.error('==========================================');
  console.error(`时间: ${new Date().toISOString()}`);
  console.error(`路径: ${req.method} ${req.originalUrl}`);
  console.error(`错误名称: ${err.name}`);
  console.error(`错误消息: ${err.message}`);
  
  if (err.stack) {
    console.error(`堆栈信息:\n${err.stack}`);
  }
  console.error('');

  // 根据错误类型返回不同的HTTP状态码
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || '服务器内部错误';

  // 常见错误类型映射
  if (err.name === 'SyntaxError' && message.includes('JSON')) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = '请求体JSON格式错误';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  }

  if (err.code === 'ENOENT') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = '请求的资源不存在';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = '请求数据过大';
  }

  // 构建标准错误响应格式
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // 记录到控制台（生产环境应该写入日志系统）
  logError(err, req);

  // 返回错误响应
  res.status(statusCode).json(errorResponse);
}

/**
 * 404处理中间件（用于处理未匹配的路由）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`路径 ${req.originalUrl} 不存在`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  
  // 对于API请求返回JSON，对于其他请求返回HTML
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `API接口 ${req.method} ${req.originalUrl} 不存在`
      },
      timestamp: new Date().toISOString()
    });
  } else {
    next(error);
  }
}

/**
 * 异步错误捕获包装器（用于路由中捕获async函数的错误）
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的函数
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 错误日志记录（简化版，生产环境应使用专业日志库如winston）
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 */
function logError(err, req) {
  const logData = {
    level: 'error',
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    errorMessage: err.message,
    errorName: err.name,
    stack: err.stack
  };

  // 控制台输出（开发环境）
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', JSON.stringify(logData, null, 2));
  }

  // 生产环境可以在这里添加：写入文件、发送到日志服务等
}

/**
 * 创建自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // 标记为可预期的操作错误

    Error.captureStackTrace(this, this.constructor);
  }
}

// 预定义常用错误
const Errors = {
  BAD_REQUEST: (message = '请求参数错误') => new AppError(400, 'BAD_REQUEST', message),
  UNAUTHORIZED: (message = '未授权访问') => new AppError(401, 'UNAUTHORIZED', message),
  FORBIDDEN: (message = '无权访问该资源') => new AppError(403, 'FORBIDDEN', message),
  NOT_FOUND: (message = '资源不存在') => new AppError(404, 'NOT_FOUND', message),
  CONFLICT: (message = '资源冲突') => new AppError(409, 'CONFLICT', message),
  INTERNAL: (message = '服务器内部错误') => new AppError(500, 'INTERNAL_ERROR', message)
};

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.AppError = AppError;
module.exports.Errors = Errors;
