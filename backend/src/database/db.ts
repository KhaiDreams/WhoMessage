import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const envFlag = process.env.APP_ENV || process.env.NODE_ENV || 'production';
const isProd = envFlag === 'production';

let sequelize: Sequelize;

if (isProd) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }
  sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  const database = process.env.DB_DATABASE as string;
  const username = process.env.DB_USER as string;
  const password = process.env.DB_PASSWORD as string;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
  });
}

export default sequelize;
