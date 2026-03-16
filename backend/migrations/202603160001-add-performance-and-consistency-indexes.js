"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addConstraint('users', {
      fields: ['username'],
      type: 'unique',
      name: 'users_username_unique'
    });

    await queryInterface.addConstraint('tags_games', {
      fields: ['user_id'],
      type: 'unique',
      name: 'tags_games_user_id_unique'
    });

    await queryInterface.addConstraint('tags_interests', {
      fields: ['user_id'],
      type: 'unique',
      name: 'tags_interests_user_id_unique'
    });

    await queryInterface.addConstraint('nicknames', {
      fields: ['user_id'],
      type: 'unique',
      name: 'nicknames_user_id_unique'
    });

    await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
      name: 'messages_conversation_created_at_idx'
    });

    await queryInterface.addIndex('messages', ['conversation_id', 'is_read', 'sender_id'], {
      name: 'messages_conversation_read_sender_idx'
    });

    await queryInterface.addIndex('matches', ['user1_id', 'chat_active'], {
      name: 'matches_user1_chat_active_idx'
    });

    await queryInterface.addIndex('matches', ['user2_id', 'chat_active'], {
      name: 'matches_user2_chat_active_idx'
    });

    await queryInterface.addIndex('notifications', ['user_id', 'created_at'], {
      name: 'notifications_user_created_at_idx'
    });

    await queryInterface.addIndex('reports', ['status', 'created_at'], {
      name: 'reports_status_created_at_idx'
    });

    await queryInterface.addIndex('likes', ['to_user_id', 'action', 'created_at'], {
      name: 'likes_target_action_created_at_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('likes', 'likes_target_action_created_at_idx');
    await queryInterface.removeIndex('reports', 'reports_status_created_at_idx');
    await queryInterface.removeIndex('notifications', 'notifications_user_created_at_idx');
    await queryInterface.removeIndex('matches', 'matches_user2_chat_active_idx');
    await queryInterface.removeIndex('matches', 'matches_user1_chat_active_idx');
    await queryInterface.removeIndex('messages', 'messages_conversation_read_sender_idx');
    await queryInterface.removeIndex('messages', 'messages_conversation_created_at_idx');

    await queryInterface.removeConstraint('nicknames', 'nicknames_user_id_unique');
    await queryInterface.removeConstraint('tags_interests', 'tags_interests_user_id_unique');
    await queryInterface.removeConstraint('tags_games', 'tags_games_user_id_unique');
    await queryInterface.removeConstraint('users', 'users_username_unique');
  }
};
