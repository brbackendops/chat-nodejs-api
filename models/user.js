'use strict';
const {
  Model
} = require('sequelize');
const { v4: uuidv4 } = require('uuid')
module.exports = (sequelize, DataTypes) => {
  
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Chat, { through: 'ChatUser' , foreignKey:'userid' })
      this.hasMany(models.ChatUser, { foreignKey: 'userid' })
      // this.hasMany(models.Message, { foreignKey: 'fromUserId' })
      // define association here
    }
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    connected: DataTypes.BOOLEAN,
    photo: DataTypes.STRING
  },{
    sequelize,
    modelName:'User',
  });
  
  User.beforeCreate((user,_) => {
    return user.id=String(uuidv4())
  });

  return User;
};