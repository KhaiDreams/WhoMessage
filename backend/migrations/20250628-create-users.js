"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pfp: {
        type: Sequelize.TEXT
      },
      bio: {
        type: Sequelize.TEXT
      },
      age: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      nicknames: {
        type: Sequelize.ARRAY(Sequelize.TEXT)
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ban: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      create_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
