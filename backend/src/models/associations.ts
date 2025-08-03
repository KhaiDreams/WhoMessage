// Arquivo para definir todas as associações dos models
import { User } from './Users/User';
import { Like } from './Interactions/Like';
import { Match } from './Interactions/Match';
import { Notification } from './Interactions/Notification';

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

export { User, Like, Match, Notification };
