import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface NicknamesInstance extends Model {
  id: number;
  user_id: number;
  psn?: string;
  xbox?: string;
  steam?: string;
  epic_games?: string;
  riot?: string;
}

export const Nicknames = sequelize.define<NicknamesInstance>('Nicknames', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  psn: {
    type: DataTypes.STRING,
  },
  xbox: {
    type: DataTypes.STRING,
  },
  steam: {
    type: DataTypes.STRING,
  },
  epic_games: {
    type: DataTypes.STRING,
  },
  riot: {
    type: DataTypes.STRING,
  }
}, {
  tableName: 'nicknames',
  timestamps: false
});
