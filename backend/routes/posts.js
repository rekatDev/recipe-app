
module.exports = function(io) {
  const express = require('express');

  const socket = io;
  const PostsController = require('../controllers/posts')(socket);

  const checkAuth = require('../middleware/check-auth');
  const extractFile = require("../middleware/file");

  const router = express.Router();

  router.post("", checkAuth, extractFile, PostsController.createPost);

  router.put('/:id', checkAuth, extractFile, PostsController.editPost);

  router.get('/:id', PostsController.getSinglePost);

  router.get('', PostsController.getPosts);

  router.delete('/:id', checkAuth, PostsController.deletePost);
  return router;
}

