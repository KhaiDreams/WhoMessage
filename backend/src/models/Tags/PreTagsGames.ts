import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface PreTagsGamesInstance extends Model {
  id: number;
  name: string;
  image: string;
}

export const PreTagsGames = sequelize.define<PreTagsGamesInstance>('PreTagsGames', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
  }
}, {
  tableName: 'pre_tags_games',
  timestamps: false
});
