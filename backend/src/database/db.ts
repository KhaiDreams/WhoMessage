import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const sequelize = new Sequelize({
    database: process.env.DB_DATABASE as string,
    username: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT as string),
    dialect: 'postgres',
});

export default sequelize;
