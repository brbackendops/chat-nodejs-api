'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid')
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.User,{ through:'ChatUser' , foreignKey:'chatid' })
      this.hasMany(models.ChatUser,{ foreignKey:'chatid' })
      this.hasMany(models.Messages,{ foreignKey:'chatid' })      
    }
  }
  Chat.init({
    name: DataTypes.STRING,
    isGroupChat: DataTypes.BOOLEAN,
    createdBy:DataTypes.STRING,
    photoUrl: {
      type: DataTypes.STRING,
      get(){
        const bool = this.getDataValue('isGroupChat')
        const photo = this.getDataValue('photoUrl')
        if ( photo != null || photo != " " ){
          return photo
        }
        if (bool){
            return 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/groupPhotoUrl.png'
        } else {
            return 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/singleUserPhotoUrl.png'          
        }
      }
    },
    // photoUrl: DataTypes.STRING
  },{
    sequelize,
    modelName: 'Chat',
  });
  Chat.beforeCreate((chat,_) => {
    return chat.id=uuidv4();
  });

  // Chat.beforeFind((inst,options) => {
  //   if (inst.isGroupChat === false){
  //     inst.photoUrl = ''
  //   } else {
  //     inst.photoUrl = ''
  //   }
  // })
  return Chat;
};