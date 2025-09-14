import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface LikeInstance extends Model {
  id: number;
  from_user_id: number;
  to_user_id: number;
  action: 'like' | 'pass';
  created_at: Date;
}

export const Like = sequelize.define<LikeInstance>('Like', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  to_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('like', 'pass'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'likes',
  timestamps: false
});
