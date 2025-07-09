import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/db';
import { User } from '../Users/User';

interface FeedbackAttributes {
  id: number;
  user_id: number;
  message: string;
  created_at?: Date;
}

interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'created_at'> {}

export class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
  public id!: number;
  public user_id!: number;
  public message!: string;
  public created_at!: Date;
}

Feedback.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'feedbacks',
    timestamps: false,
  }
);

Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
