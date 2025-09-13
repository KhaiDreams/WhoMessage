import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface ReportInstance extends Model {
    id: number;
    reporter_id: number;
    reported_user_id: number;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    admin_notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const Report = sequelize.define<ReportInstance>('Report', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reported_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        defaultValue: 'pending'
    },
    admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
    },
}, {
    tableName: 'reports',
    timestamps: true
});