import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/db';
import { User, UserInstance } from '../Users/User';

interface ConversationAttributes {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> 
  implements ConversationAttributes {
  public id!: number;
  public user1Id!: number;
  public user2Id!: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user1?: UserInstance;
  public user2?: UserInstance;
  public messages?: any[];
}

Conversation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user1_id'
  },
  user2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user2_id'
  }
}, {
  sequelize,
  tableName: 'conversations',
  underscored: true,
  timestamps: true,
});

export { Conversation };