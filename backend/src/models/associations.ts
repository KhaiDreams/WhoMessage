// Arquivo para definir todas as associações dos models
import { User } from './Users/User';
import { Like } from './Interactions/Like';
import { Match } from './Interactions/Match';
import { Notification } from './Interactions/Notification';
import { Report } from './Reports/Report';
import { Conversation } from './Chat/Conversation';
import { Message } from './Chat/Message';

// Associações para Like
Like.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
Like.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

User.hasMany(Like, { foreignKey: 'from_user_id', as: 'sentLikes' });
User.hasMany(Like, { foreignKey: 'to_user_id', as: 'receivedLikes' });

// Associações para Match
Match.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Match.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

User.hasMany(Match, { foreignKey: 'user1_id', as: 'matchesAsUser1' });
User.hasMany(Match, { foreignKey: 'user2_id', as: 'matchesAsUser2' });

// Associações para Notification
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(Notification, { foreignKey: 'from_user_id', as: 'sentNotifications' });

// Associações para Report
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'reportedUser' });

User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reportsMade' });
User.hasMany(Report, { foreignKey: 'reported_user_id', as: 'reportsReceived' });

// Associações para Conversation
Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

User.hasMany(Conversation, { foreignKey: 'user1_id', as: 'conversationsAsUser1' });
User.hasMany(Conversation, { foreignKey: 'user2_id', as: 'conversationsAsUser2' });

// Associações para Message
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });

export { User, Like, Match, Notification, Report, Conversation, Message };
