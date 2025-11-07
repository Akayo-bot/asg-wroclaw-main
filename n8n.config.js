module.exports = {
  // Основные настройки
  general: {
    timezone: 'Europe/Warsaw',
    instanceId: 'asg-wroclaw-n8n',
  },
  
  // Настройки базы данных (можно использовать SQLite для разработки)
  database: {
    type: 'sqlite',
    location: './n8n-database.sqlite',
  },
  
  // Настройки веб-сервера
  server: {
    port: 5678,
    host: 'localhost',
  },
  
  // Настройки безопасности
  security: {
    jwtSecret: 'your-jwt-secret-here',
    jwtDurationHours: 24,
  },
  
  // Настройки логирования
  logging: {
    level: 'info',
    output: ['console', 'file'],
  },
  
  // Настройки для разработки
  development: {
    enabled: true,
  },
};


