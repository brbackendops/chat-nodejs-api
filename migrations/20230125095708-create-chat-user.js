'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChatUsers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      chatid: {
        type: Sequelize.UUID,
        allowNull:false,
        references:{
          model:'Chats',
          key:'id'
        },
        onDelete:'CASCADE'
      },
      userid: {
        type: Sequelize.STRING,
        allowNull:false,
        references:{
          model:'Users',
          key:'id'
        },
        onDelete:'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')        
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')        
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ChatUsers');
  }
};
