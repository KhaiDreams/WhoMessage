import sequelize from '../../database/db';
import { Model, DataTypes, Optional } from 'sequelize';

interface TagsGamesAttributes {
  id: number;
  user_id: number;
  pre_tag_ids: number[];
}
interface TagsGamesCreationAttributes extends Optional<TagsGamesAttributes, 'id'> {}

export class TagsGames extends Model<TagsGamesAttributes, TagsGamesCreationAttributes> implements TagsGamesAttributes {
  public id!: number;
  public user_id!: number;
  public pre_tag_ids!: number[];
}

TagsGames.init({
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
  sequelize,
  tableName: 'tags_games',
  timestamps: false
});
