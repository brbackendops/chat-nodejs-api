'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn(
      'Chats',
      'photoUrl',
      {
        type: Sequelize.STRING,
        allowNull:true,
        defaultValue:'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/singleUserPhotoUrl.png'
      }
    )    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
