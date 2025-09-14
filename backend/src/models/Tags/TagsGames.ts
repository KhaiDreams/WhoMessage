import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface TagsGamesInstance extends Model {
  id: number;
  user_id: number;
  pre_tag_ids: number[];

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
  pre_tag_ids: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    validate: {
      minItems(value: number[]) {
        if (!value || value.length < 3) {
          throw new Error('At least 3 games required');
        }
      },
      maxItems(value: number[]) {
        if (value && value.length > 20) {
          throw new Error('Maximum 20 games allowed');
        }
      }
    }
  }
}, {
  tableName: 'tags_games',
  timestamps: false
});
