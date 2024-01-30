import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface UserInstance extends Model{
    id: number;
    username: string;
    email: string;
    password: string;
    description: string;
    profilepicture: string;
    active: Boolean;
}

export const User = sequelize.define<UserInstance>('User',{
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },

    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    description: {
        type: DataTypes.STRING,
    },

    profilepicture: {
        type: DataTypes.STRING,
    },

    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    },{
        tableName: 'users',
        timestamps: false
});
