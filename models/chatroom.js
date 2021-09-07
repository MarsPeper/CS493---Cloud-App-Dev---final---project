
const { extractValidFields } = require('../lib/validation');

// connect to mongo
const { getDBReference } = require('../lib/mongo');

var ObjectId = require('mongodb').ObjectID;

const {
  getUserById
} = require('../models/user')


const ChatroomSchema = {
  users: { required: true },
};
exports.ChatroomSchema = ChatroomSchema;


async function createChatroom(users){
  let insert = {
    "users": users,
    "messages": []
  }
    // let chatroom = extractValidFields(info, ChatroomSchema);
    const db = getDBReference();
    const collection = db.collection('chatrooms');

    const results = await collection.insertOne(insert);
    return results.insertedId;
}
exports.createChatroom = createChatroom;

async function deleteChatroom(id) {
  const db = await getDBReference();
  const collection = db.collection('chatrooms');

  const result = await collection.deleteOne({_id: new ObjectId(id)});

  return
}
exports.deleteChatroom = deleteChatroom;

async function getChatroom(id){
  const db = await getDBReference();
  const collection = db.collection('chatrooms');
  const results = await collection.find({_id: new ObjectId(id)}).toArray();
  return results[0];
}
exports.getChatroom = getChatroom;

async function authenticateChatroom(email, chatId){
  const chatroom = await getChatroom(chatId);

  if (chatroom.users.includes(email) ){
    return true;
  } else{
    return false;
  }
}
exports.authenticateChatroom = authenticateChatroom

async function postChatroom(id, message){
  const db = await getDBReference();
  const collection = db.collection('chatrooms');
  const results = await collection.updateOne({_id: new ObjectId(id)} , {$push: { "messages": message }});
}
exports.postChatroom = postChatroom;

async function deleteChatroom(id) {
  const db = await getDBReference();
  const collection = db.collection('chatrooms');

  const result = await collection.deleteOne({_id: new ObjectId(id)});

  return
}
exports.deleteChatroom = deleteChatroom;

async function getChatroomByUser(userId) {
  const user = await getUserById(userId)
  console.log("email: " , user.email)
  const db = await getDBReference();
  const collection = db.collection('chatrooms');
  const results = await collection.find( { users: { $in: [ user.email ] } } ).toArray();
  console.log("results: " , results)

  let urlList = []
  for (var i=0; i < results.length; i++){
    let url = "/chatrooms/" + results[i]._id
    urlList.push(url)
  }

  return urlList;
}
exports.getChatroomByUser = getChatroomByUser;
