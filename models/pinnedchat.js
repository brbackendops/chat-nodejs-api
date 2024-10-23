'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PinnedChat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Chat,{ foreignKey:'chatid' })
      this.belongsTo(models.User,{ foreignKey: 'creator'})
    }
  }
  PinnedChat.init({
    chatid: DataTypes.UUID,
    creator: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PinnedChat',
  });
  return PinnedChat;
};