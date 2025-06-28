import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/db';

export interface TagsInterestsInstance extends Model {
  id: number;
  user_id: number;
  name: string[];
}

export const TagsInterests = sequelize.define<TagsInterestsInstance>('TagsInterests', {
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
          throw new Error('At least 3 interests required');
        }
      },
      maxItems(value: string[]) {
        if (value && value.length > 10) {
          throw new Error('Maximum 10 interests allowed');
        }
      }
    }
  }
}, {
  tableName: 'tags_interests',
  timestamps: false
});
