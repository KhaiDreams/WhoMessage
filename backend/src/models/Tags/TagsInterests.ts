import sequelize from '../../database/db';
import { Model, DataTypes, Optional } from 'sequelize';

interface TagsInterestsAttributes {
  id: number;
  user_id: number;
  pre_tag_ids: number[];

interface TagsInterestsCreationAttributes extends Optional<TagsInterestsAttributes, 'id'> {}

export class TagsInterests extends Model<TagsInterestsAttributes, TagsInterestsCreationAttributes> implements TagsInterestsAttributes {
  public id!: number;
  public user_id!: number;
  public pre_tag_ids!: number[];
}

TagsInterests.init({
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
          throw new Error('At least 3 interests required');
        }
      },
      maxItems(value: number[]) {
        if (value && value.length > 10) {
          throw new Error('Maximum 10 interests allowed');
        }
      }
    }
  }
}, {
  sequelize,
  tableName: 'tags_interests',
  timestamps: false
});
