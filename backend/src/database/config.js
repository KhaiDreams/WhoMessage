require('dotenv').config();

const envFlag = process.env.APP_ENV || process.env.NODE_ENV || 'production';
const isProd = envFlag === 'production';

const productionConfig = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
};

const developmentConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  dialect: 'postgres',
  logging: false
};

module.exports = {
  development: isProd ? productionConfig : developmentConfig,
  production: productionConfig
};
