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
    unique: true
  },
  xbox: {
    type: DataTypes.STRING,
    unique: true
  },
  steam: {
    type: DataTypes.STRING,
    unique: true
  },
  epic_games: {
    type: DataTypes.STRING,
    unique: true
  },
  riot: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  tableName: 'nicknames',
  timestamps: false
});
