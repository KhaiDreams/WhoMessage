import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface NotificationInstance extends Model {
  id: number;
  user_id: number;
  from_user_id?: number;
  type: 'like_received' | 'match_created' | 'message_received';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

export const Notification = sequelize.define<NotificationInstance>('Notification', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('like_received', 'match_created', 'message_received'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'notifications',
  timestamps: false
});
