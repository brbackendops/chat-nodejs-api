'use strict';
const {
  Model
} = require('sequelize');
// const moment = require('moment')
const moment = require('moment-timezone');

module.exports = (sequelize, DataTypes) => {
  class Messages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Chat,{ foreignKey: 'chatid' }),
      this.belongsTo(models.User,{ as:"fromUser", foreignKey:'fromuserid' })
    }

  }
  Messages.init({
    chatid: DataTypes.UUID,
    type: DataTypes.STRING,
    fromuserid: DataTypes.UUID,
    message: {
      type: DataTypes.TEXT,
      get(){
        const type = this.getDataValue('type')
        const id = this.getDataValue('chatid')
        const content = this.getDataValue('message')
        return type === 'text' ? content : content
      }
    },
    time: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      get(){
        let date = this.getDataValue('createdAt')
        const now = moment.tz('Asia/Kolkata');    
        
        let date_now =  moment(date).from(new Date())
        if (date_now == "a few seconds ago"){
          return "just now"
        }
        return date_now
      }
    }
  }, {
    sequelize,
    modelName: 'Messages',
  });
  // Messages.beforeSave(async(msg,options) => {
  //   // console.log(options)
  //   const now = moment.tz('Asia/Kolkata');
  //   // const formatDate = now.format(msg.createdAt)
  //   // msg.time = moment(msg.createdAt);
  //   // msg.time = formatDate
  // })
  return Messages;
};
