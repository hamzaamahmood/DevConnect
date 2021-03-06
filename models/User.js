const userCollection = require('../db').db().collection('users');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const md5 = require('md5');

let User = function(data, getAvatar) {
  this.data = data
  this.errors = []
  if(getAvatar == undefined) {getAvatar = false}
  if(getAvatar){this.getAvatar()}
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username) !== "string"){this.data.username = ""}
    if(typeof(this.data.email) !== "string"){this.data.email = ""}
    if(typeof(this.data.password) !== "string"){this.data.passowrd = ""}
    this.data = {
      username: this.data.username.trim().toLowerCase(),
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password
    }
}

User.prototype.validate = function(){
  return new Promise(async (resolve, reject) => {
    if(this.data.username === ''){this.errors.push("You must provide a username.")}
    if(this.data.username !== '' && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")}
    if(!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email.")}
    if(this.data.password === ''){this.errors.push("You must provide a password.")}
    if(this.data.password.length > 0 && this.data.password.length < 12){this.errors.push("Password must be at least 12 characters")}
    if(this.data.password.length > 50){this.errors.push("Password cant exceed 50 chars")}
    if(this.data.username.length > 0 && this.data.username.length < 3){this.errors.push("Username must be at least 3 characters")}
    if(this.data.username.length > 30){this.errors.push("Username cant exceed 30 chars")}

    // already taken username
    if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
      let usernameExists = await userCollection.findOne({username: this.data.username})
      if(usernameExists){this.errors.push("That username is already taken")}
    }
    // already taken email
    if(validator.isEmail(this.data.email)){
      let emailExists = await userCollection.findOne({email: this.data.email})
      if(emailExists){this.errors.push("That email is already taken")}
    }
    resolve()
  })
}

User.prototype.login = function(){
  return new Promise((resolve, reject) => {
  this.cleanUp()
  userCollection.findOne({username: this.data.username}).then((user) => {
    if(user && bcrypt.compareSync(this.data.password, user.password)){
      this.data = user
      this.getAvatar()
      resolve('congrats')
    }else{
      reject('Invalid username/password')
    }
  }).catch(() => {
    reject('Please try again later')
  })

  })
}

User.prototype.register = function(){
  return new Promise(async (resolve, reject) => {
    // Validate data
    this.cleanUp()
    await this.validate()
    // Save data in database
    if(!this.errors.length){
      //hashing
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await userCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    }else{
      reject(this.errors)
    }

  })
}

User.prototype.getAvatar = function(){
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUserName = (username) => {
  return new Promise((resolve, reject) => {
    if(typeof(username) != 'string'){
      reject()
      return
    }
    userCollection.findOne({username: username}).then((userDoc) => {
      if(userDoc){
        userDoc = new User(userDoc, true)
        userDoc = {
          _id: userDoc.data._id,
          username: userDoc.data.username,
          avatar: userDoc.avatar
        }
        resolve(userDoc)
      } else{
        reject()
      }
    }).catch(() => {

    })

  })
}

module.exports = User
