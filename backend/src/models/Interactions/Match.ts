import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface MatchInstance extends Model {
  id: number;
  user1_id: number;
  user2_id: number;
  matched_at: Date;
  chat_active: boolean;
}

export const Match = sequelize.define<MatchInstance>('Match', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  user1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  matched_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  chat_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'matches',
  timestamps: false
});
