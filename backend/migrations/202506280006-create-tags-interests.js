"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tags_interests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      pre_tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pre_tags_interests', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tags_interests');
  }
};
