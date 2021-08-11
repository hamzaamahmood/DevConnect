const postCollection = require('../db').db().collection("posts")
const ObjectId = require('mongodb').ObjectID
const User = require('./User')

let Post = function(data, userId, reqPostId){
  this.data = data
  this.errors = []
  this.userId = userId
  this.reqPostId = reqPostId
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title = ''}
    if(typeof(this.data.body) != "string"){this.data.body = ''}

    this.data = {
      title: this.data.title.trim(),
      body: this.data.body.trim(),
      author: ObjectId(this.userId),
      createdDate: new Date()
    }
}

Post.prototype.create = function(){
    return new Promise((resolve, reject) => {
      this.cleanUp()
      this.validate()
      if(!this.errors.length){
        // save post database
        postCollection.insertOne(this.data).then(() => {
          resolve()
        }).catch(() => {
          this.errors.push("Please try again later")
          reject(this.errors)
        })
      }else{
        reject(this.errors)
      }
    })
}

Post.prototype.update = function(){
  return new Promise(async (resolve, reject) => {
    try {
        let post = await Post.findSingleById(this.reqPostId, this.userId)
        if(post.isVisitorOwner){
          let status = await this.actuallyUpdate()
          resolve(status)
        }else{
          reject()
        }
    } catch (e) {
      reject()
    }
  })
}

Post.prototype.actuallyUpdate = function(){
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length){
      await postCollection.findOneAndUpdate({_id: new ObjectId(this.reqPostId)}, {$set: {title: this.data.title, body: this.data.body}})
      resolve("success")
    }else{
      resolve("failure")
    }
  })
}

Post.prototype.validate = function(){
  if(this.data.title == ""){this.errors.push("You must provide a title")}
  if(this.data.post == ""){this.errors.push("You must provide a post")}
}

Post.reusablePostQuery = function(operation, visitorid){
  return new Promise( async function(resolve, reject){
    let op = operation.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument",0]}
      }}
    ])
    let posts = await postCollection.aggregate(op).toArray()

    posts = posts.map(function(post){
      post.isVisitorOwner = post.authorId.equals(visitorid, )
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    resolve(posts)
  })
}

Post.findSingleById = function(id, visitorId){
  return new Promise( async function(resolve, reject){
    if(typeof(id) != "string" || !ObjectId.isValid(id)){
      reject()
      return
    }
    let posts = await Post.reusablePostQuery([{$match: {_id: new ObjectId(id)}}], visitorId)
    if(posts.length){
      console.log(posts[0]);
      resolve(posts[0])
    }else{
      reject()
    }
  })
}

Post.findAuthorById = function(authorId){
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

module.exports = Post
