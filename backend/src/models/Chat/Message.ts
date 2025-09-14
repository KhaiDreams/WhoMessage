import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database/db';
import { UserInstance } from '../Users/User';
import { Conversation } from './Conversation';

interface MessageAttributes {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> 
  implements MessageAttributes {
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string;
  public messageType!: 'text' | 'image' | 'file';
  public isRead!: boolean;
  public readAt?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public sender?: UserInstance;
  public conversation?: Conversation;
}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'conversation_id'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file'),
    defaultValue: 'text',
    field: 'message_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  }
}, {
  sequelize,
  tableName: 'messages',
  underscored: true,
  timestamps: true,
});

export { Message };