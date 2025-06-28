"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('nicknames', {
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
      psn: {
        type: Sequelize.STRING,
        unique: true
      },
      xbox: {
        type: Sequelize.STRING,
        unique: true
      },
      steam: {
        type: Sequelize.STRING,
        unique: true
      },
      epic_games: {
        type: Sequelize.STRING,
        unique: true
      },
      riot: {
        type: Sequelize.STRING,
        unique: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('nicknames');
  }
};
