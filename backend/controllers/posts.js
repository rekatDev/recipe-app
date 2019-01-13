module.exports = function(io) {
  const Post = require('../models/post');

  const module = {};

  module.createPost = (req, res, next) => {
    const url = req.protocol + '://' + req.get("host");
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: url + "/images/" + req.file.filename,
      creator: req.userData.userId
    });
    post.save()
    .then(result => {
      io.emit('post', {
        message: 'post changed!'
      });
      res.status(201).json({
        post: {
          ...result,
          id: result._id
        },
        message: 'Post added successfully'
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Creating a post failed!"
      })
    });
  }

  module.editPost = (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
      const url = req.protocol + '://' + req.get("host");
      imagePath = url + "/images/" + req.file.filename;
    }

    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath,
      creator: req.userData.userId
    });
    Post.findOneAndUpdate({_id: req.params.id, creator: req.userData.userId}, post)
    .then( result => {
      if (result.n > 0) {
        io.emit('post', {
          message: 'post changed!'
        });
        res.status(200).json({
          imagePath: imagePath,
          message: 'Update successful!'
        });
      } else {
        res.status(401).json({
          message: 'Not Authorized!'
        })
      }

    })
    .catch(error => {
      res.status(500).json({
        message: "Couldn't update post!"
      });
    });
  }

  module.getSinglePost = (req, res, next)  => {
    Post.findById(req.params.id).then(post => {
        if(post) {
          res.status(200).json(post);
        }else {
          res.status(404).json({message: 'Post not found!'});
        }
    }).catch( (error) => {
      res.status(500).json({
        message: "Fetching post failed!"
      });
    });
  }

  module.getPosts = (req, res, next) => {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const postQuery = Post.find();
    let fetchedPosts;
    if (pageSize && currentPage) {
      postQuery
        .skip(pageSize * (currentPage - 1))
        .limit(pageSize);
    }
    postQuery
      .then(documents => {
        fetchedPosts = documents;
        return Post.countDocuments();
      })
      .then(count => {
        res.status(200).json({
          message: 'Posts fetched succesfully!',
          posts: fetchedPosts,
          maxPosts: count
        });
      }).catch( (error) => {
        res.status(500).json({
          message: "Fetching posts failed!"
        });
      });
  }

  module.deletePost = (req, res, next) => {
    Post.deleteOne({_id: req.params.id, creator: req.userData.userId})
    .then( result => {
      if (result.n > 0) {
        io.emit('post', {
          message: 'post changed!'
        });
        res.status(200).json({
          message: 'Post deleted'
        })
      }else {
        res.status(401).json({
          message: 'Not Autorized!'
        })
      }
    }).catch( (error) => {
      res.status(500).json({
        message: "Deleting post failed!"
      });
    });;
  }

  return module;
}
