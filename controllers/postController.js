const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res){
  res.render('create-post')
}

exports.create = function(req, res){
  let post = new Post(req.body, req.session.user._id)
  post.create().then(() => {
    res.send('New post created')
  }).catch((e) => {
    res.send(e)
  })
}

exports.viewSingle = async function(req, res){
  try{
    let post = await Post.findSingleById(req.params.id, req.visitorid)
    res.render('single-post-screen', {post: post})
  }catch{
    res.render('404')
  }

}

exports.editScreen = async function(req, res){
  try{
      let post = await Post.findSingleById(req.params.id)
      res.render("edit-post", {post:post})
  }
  catch{
    res.render("404")
  }
}

exports.edit = function(req, res){
  let post = new Post(req.body, req.visitorid, req.params.id)
  post.update().then((status) => {
    if(status == "success"){
      req.flash("errors","Post successfully updated.")
      res.redirect(`/post/${req.params.id}/edit`)
    }else{
      post.errors.forEach(function(error){
        req.flash("errors", error)
      })
      req.session.save(function(){
        res.redirect(`/post/${req.params.id}/edit`)
      })
    }
  }).catch(() => {
    // not the owner of post || post doesnt exist
    req.flash("errors", "You do not have the permission to perform this action")
    req.session.save(() => {
      res.redirect('/')
    })
  })
}
