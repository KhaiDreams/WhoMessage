import { Model, DataTypes } from 'sequelize';
import sequelize from '../../database/db';

export interface PreTagsInterestsInstance extends Model {
  id: number;
  name: string;
}

export const PreTagsInterests = sequelize.define<PreTagsInterestsInstance>('PreTagsInterests', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'pre_tags_interests',
  timestamps: false
});
