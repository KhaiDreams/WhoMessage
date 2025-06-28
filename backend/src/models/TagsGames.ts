import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';

export interface TagsGamesInstance extends Model {
  id: number;
  user_id: number;
  name: string[];
  image: string[];
}

export const TagsGames = sequelize.define<TagsGamesInstance>('TagsGames', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    validate: {
      minItems(value: string[]) {
        if (!value || value.length < 3) {
          throw new Error('At least 3 games required');
        }
      },
      maxItems(value: string[]) {
        if (value && value.length > 20) {
          throw new Error('Maximum 20 games allowed');
        }
      }
    }
  },
  image: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  }
}, {
  tableName: 'tags_games',
  timestamps: false
});
