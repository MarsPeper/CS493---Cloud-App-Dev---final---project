const express = require('express');
const morgan = require('morgan');
const redis = require('redis');
const {
  getDownloadStreamByFilename
} = require('./models/photo');


const rateLimitWindowMS = 60000;
const rateLimitMaxRequests = 20;

const api = require('./api');

const app = express();
const port = process.env.PORT || 8080;

const { connectToDB } = require('./lib/mongo');

const redisClient = redis.createClient(
  process.env.REDIS_PORT || '6379',
  process.env.REDIS_HOST || 'localhost'
);

function getUserTokenBucket(ip) {
  return new Promise((resolve, reject) => {
    redisClient.hgetall(ip, (err, tokenBucket) => {
      if (err) {
        reject(err);
      } else if (tokenBucket) {
        tokenBucket.tokens = parseFloat(tokenBucket.tokens);
        resolve(tokenBucket);
      } else {
        resolve({
          tokens: rateLimitMaxRequests,
          last: Date.now()
        });
      }
    });
  });
}

function saveUserTokenBucket(ip, tokenBucket) {
  return new Promise((resolve, reject) => {
    redisClient.hmset(ip, tokenBucket, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function rateLimit(req, res, next) {
  try {
    const tokenBucket = await getUserTokenBucket(req.ip);

    const currentTimestamp = Date.now();
    const ellapsedTime = currentTimestamp - tokenBucket.last;
    tokenBucket.tokens += ellapsedTime *
      (rateLimitMaxRequests / rateLimitWindowMS);
    tokenBucket.tokens = Math.min(
      tokenBucket.tokens,
      rateLimitMaxRequests
    );
    tokenBucket.last = currentTimestamp;

    if (tokenBucket.tokens >= 1) {
      tokenBucket.tokens -= 1;
      await saveUserTokenBucket(req.ip, tokenBucket);
      next();
    } else {
      res.status(429).send({
        error: "Too many request per minute.  Please wait a bit..."
      });
    }
  } catch (err) {
    next();
  }
}

app.use(rateLimit);


/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const {
  postChatroom
} = require('./models/chatroom');

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('message', 'Welcome to chat')

  socket.on('chatMessage', async msg => {
    console.log("msg", msg)
    await postChatroom(msg.id, msg.message);
  })
});


/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */

app.use('/', api);

app.get('/media/images/:filename', (req, res, next) => {
  getDownloadStreamByFilename(req.params.filename)
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

// app.listen(port, function() {
//   console.log("== Server is running on port", port);
// });
connectToDB(() => {
  server.listen(port, function() {
    console.log("== Server is running on port", port);
  });
});