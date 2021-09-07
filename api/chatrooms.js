const router = require('express').Router();

const port = process.env.PORT || 8080;

// added
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
// const bcrypt = require('bcryptjs');

// authentication
const {
  generateAuthToken,
  requireAuthentication,
  checkAdmin,
  
} = require('../lib/authenticate');

const {
  getUserById
} = require('../models/user')

const {
  ChatroomSchema,
  createChatroom,
  getChatroom,
  authenticateChatroom,
  deleteChatroom
} = require('../models/chatroom');

var ioClient = require('socket.io-client')


router.get('/:id', requireAuthentication , async (req, res) => {
  const user = await getUserById(req.userId)
  console.log("false" , await authenticateChatroom(user.email, req.params.id))
  if (await authenticateChatroom(user.email, req.params.id)){
    const chatroom = await getChatroom(req.params.id)

    socket = ioClient.connect('http://localhost:'+ port);

    res.send({ "message": chatroom.messages});
  } else{
    res.status(400).send("You do not have permission")
  }
  
});


router.post('/:id', requireAuthentication, async (req, res) => {
  const user = await getUserById(req.userId)

  if (await authenticateChatroom(user.email, req.params.id)){
    const info = { 
      "message" : req.body.message,
      "id": req.params.id
    }
    socket = ioClient.connect('http://localhost:'+ port);
    socket.emit('chatMessage',info)

    res.status(200).send("added");
  } else{
    res.status(400).send("You do not have permission")
  }

});


router.post('/', requireAuthentication , async (req, res) => {
  const user = await getUserById(req.userId)
  if (req.body.user){
    const userList = [user.email, req.body.user]
    const chatId = await createChatroom(userList);   
    res.send(chatId); 
  } else{
    res.status(400).json({
        error: "Request body does not contain valid users."
    });
  }
  
});

router.delete('/:id', requireAuthentication , async (req, res) => {
  const user = await getUserById(req.userId)

  if (await authenticateChatroom(user.email, req.params.id)){
    await deleteChatroom(req.params.id);
    res.status(200).send("deleted");
  } else{
    res.status(400).send("You do not have permission")
  }
  
});

module.exports = router;
