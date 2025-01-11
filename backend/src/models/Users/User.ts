import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface UserInstance extends Model {
    id: number;
    email: string;
    password_hash: string;
    username: string;
    pfp: string;
    bio: string;
    age: number;
    nicknames: string[];
    active: Boolean;
    is_admin: Boolean;
    ban: Boolean;
}

export const User = sequelize.define<UserInstance>('User', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pfp: {
        type: DataTypes.TEXT,
    },
    bio: {
        type: DataTypes.TEXT,
    },
    age: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
            min: 14,
            max: 99,
        },
    },
    nicknames: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    ban: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'create_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
    },
}, {
    tableName: 'users',
    timestamps: true
});
