const User = require('../models/User')
const Post = require('../models/Post')

exports.mustBeLoggedIn = (req, res, next) => {
  if(req.session.user){
    next()
  }else{
    req.flash("errors", "You must be logged in to perform that action")
    req.session.save(() => {
      res.redirect('/')
    })
  }
}

exports.login = (req, res) => {
  let user = new User(req.body)
  user.login().then((result) => {
    req.session.user = {username: user.data.username, avatar:user.avatar, _id:user.data._id}
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch((err) => {
    req.flash('errors', err)
    req.session.save(() => {
      res.redirect('/')
    })
  })

}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  })
}

exports.register = (req, res) => {
  let user = new User(req.body)
  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach((e) => {
      req.flash('regErrors', e)
    })
    req.session.save(() => {
      res.redirect('/')
    })
  })

}

exports.home = (req, res) => {
  if(req.session.user){
    res.render('home-dashboard')
  }else{
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }
}

exports.ifUserExists = (req, res, next) => {
  User.findByUserName(req.params.username).then((userDocument) => {
    req.profileUser = userDocument
    next()
  }).catch(() => {
    res.render('404')
  })
}

exports.profilePostsScreen = (req, res) => {
  Post.findAuthorById(req.profileUser._id).then((posts) => {
    res.render('profile', {
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar
    })
  }).catch(() => {
    res.render('404')
  })

}
