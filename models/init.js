const {Sequelize, DataTypes } = require("sequelize");
console.log( process.env.DB_PASSWORD)
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD,
  {
    host:process.env.DB_HOST,
    dialect: 'postgres',
    logging:false
  }
)
const User = sequelize.define('User',{
  id: {type:DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  username : {type: DataTypes.STRING, unique: true, allowNull: false},
  email:{type:DataTypes.STRING, unique: true, allowNull:false },
  password: {type: DataTypes.TEXT, allowNull: false},
  confirmed: {type: DataTypes.BOOLEAN, defaultValue:false},
  avatar: {type: DataTypes.TEXT},
  resetToken:{type:DataTypes.TEXT}
},{
  tableName: 'users',
  timestamps: true
})
//  Chats table
const Chat = sequelize.define("Chat", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  is_group: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "chats",
  timestamps: false
});

// Chat Participants (many-to-many)
const ChatUser = sequelize.define("ChatUser", {
  chat_id: { type: DataTypes.INTEGER, references: { model: Chat, key: "id" } },
  user_id: { type: DataTypes.INTEGER, references: { model: User, key: "id" } },
}, {
  tableName: "chat_users",
  timestamps: false
});

// Messages table
const Message = sequelize.define("Message", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chat_id: { type: DataTypes.INTEGER, references: { model: Chat, key: "id" } },
  sender_id: { type: DataTypes.INTEGER, references: { model: User, key: "id" } },
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "messages",
  timestamps: false
});

// 3️⃣ Associations
User.belongsToMany(Chat, { through: ChatUser, foreignKey: "user_id" });
Chat.belongsToMany(User, { through: ChatUser, foreignKey: "chat_id" });

Chat.hasMany(Message, { foreignKey: "chat_id" });
Message.belongsTo(Chat, { foreignKey: "chat_id" });

User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id" });

(async ()=>{
  try{
    await sequelize.authenticate(); 
    await sequelize.sync({alter:false})
    // await sequelize.truncate({ cascade: true });
  }catch(error){ 
  }

})();

module.exports = { sequelize, User, Chat, ChatUser, Message };