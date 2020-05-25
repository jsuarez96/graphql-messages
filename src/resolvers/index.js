const _ = require('lodash')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const emailValidator = require("email-validator")
const phoneValidator = require('phone')
const shortid = require('shortid')
const SALT_TIMES = 12

const isValidPhone = (phoneNumber) => {
  return phoneValidator(phoneNumber).length > 0
}
  
const isValidEmail = (email) => {
  return emailValidator.validate(email)
}
  
const createUserEntry = (context, email, phone, password) => {
  const passwordHash = bcrypt.hashSync(password, SALT_TIMES)
  const id = shortid.generate()
  const newUser = {
    id,
    email,
    phone,
    passwordHash,
    following: []
  }
  context.db.get('users')
    .push(newUser)
    .write()

  const token = jwt.sign({ id }, context.secret)
  const user = _.omit(newUser, ['passwordHash'])
  return {
    token,
    user
  }
}

const standardizePhone = (phoneNumber) => {
  const validPhone = phoneValidator(phoneNumber)
  if (validPhone.length > 0) {
    return validPhone[0]
  }
  return phoneNumber
}
  
const createUser = (object, args, context, info) => {
  if (isValidPhone(args.phone) || isValidEmail(args.email)) {
    if (!getUser(context, args.email, args.phone)) {
      args.phone = standardizePhone(args.phone)
      return createUserEntry(context, args.email, args.phone, args.password)
    } else {
      throw new Error(`User with email: ${args.email} or phone: ${args.phone} already exists!`)
    }
  } else {
    throw new Error(`Please provide valid email or phone number to register.`)
  }
}
  
const followUser = (object, args, context, info) => {
  verifyLoggedIn(context)
  const userToFollow = getUserById(context, args.id)
  if (userToFollow) {
    if (userToFollow.id !== context.user.id) {
      const followingList = context.user.following
      if (!followingList.includes(userToFollow.id)) {
        followingList.push(userToFollow.id)
        context.db.get('users')
          .find({ id: context.user.id })
          .assign({ following: followingList})
          .write()
      }
      return getUserById(context, context.user.id)
    } else {
      return new Error(`Unable to follow your own account`)
    }
  } else {
    return new Error(`Please provide id of valid user to follow`)
  }
}
  
const unfollowUser = (object, args, context, info) => {
  verifyLoggedIn(context)
  const userToUnfollow = getUserById(context, args.id)
  if (userToUnfollow) {
    let followingList = context.user.following
    if (followingList.includes(userToUnfollow.id)) {
      followingList = followingList.filter((user) => {
        return user !== userToUnfollow.id
      })
      context.db.get('users')
        .find({ id: context.user.id })
        .assign({ following: followingList})
        .write()
    }
    return getUserById(context, context.user.id)
  } else {
    return new Error(`Please provide id of valid user to unfollow`)
  }
}
  
const getUser = (context, email, phone) => {
  const emailUser = context.db.get('users')
    .find({ email: email })
    .value()

  const phoneUser = context.db.get('users')
    .find({ phone: phone })
    .value()

  return emailUser || phoneUser
}
  
const getUserById = (context, id) => {
  const user = context.db.get('users')
    .find({ id })
    .value()

  return user
}

const getMessageById = (context, id) => {
  const message = context.db.get('messages')
    .find({ id })
    .value()

  return message
}
  
const getMessagesByUser = (context, userId) => {
  const messages = context.db.get('messages')
    .filter({ user: userId})
    .value()
  
  return messages
}

const passwordCorrect = (passwordHash, password) => {
  return bcrypt.compareSync(password, passwordHash)
}
  
const login = (object, args, context, info) => {
  args.phone = standardizePhone(args.phone)
  const existingUser = getUser(context, args.email, args.phone)
  if (existingUser) {
    if (passwordCorrect(existingUser.passwordHash, args.password)) {
      const token = jwt.sign({ id: existingUser.id }, context.secret)
      const user = _.omit(existingUser, ['passwordHash'])
      return {
        token,
        user
      }
    } else {
      throw new Error(`Incorrect password entered for email: ${args.email} /phone: ${args.phone}`)
    }
  } else {
    throw new Error(`User with email: ${args.email} or phone: ${args.phone} does not exist!`)
  }
}
  
//Verify authentication was successful in context method
const verifyLoggedIn = (context) => {
  if (!context.user) throw new Error(`Must be logged in to access this endpoint`)
}
  
const postMessage = (object, args, context, info) => {
  verifyLoggedIn(context)
  const id = shortid.generate()
  const newMessage = {
    id,
    message: args.message,
    user: context.user.id
  }

  context.db.get('messages')
    .push(newMessage)
    .write()

  return newMessage
}
  
const editMessage = (object, args, context, info) => {
  verifyLoggedIn(context)
  const message = getMessageById(context, args.id)
  if (message.user === context.user.id) {
    context.db.get('messages')
      .find({ id: args.id })
      .assign({ message: args.newMessage})
      .write()

    return getMessageById(context, args.id)
  } else {
    throw new Error(`Unable to edit messages belonging to another user!`)
  }
}
  
const deleteMessage = (object, args, context, info) => {
  verifyLoggedIn(context)
  const message = getMessageById(context, args.id)
  if (message.user === context.user.id) {
    context.db.get('messages')
      .remove({ id: args.id })
      .write()

    return message
  } else {
    throw new Error(`Unable to delete messages belonging to another user!`)
  }
}

const message = (object, args, context, info) => {
  verifyLoggedIn(context)
  return getMessageById(context, args.id)
}

const messages = (object, args, context, info) => {
  verifyLoggedIn(context)
  const messages = context.db.get('messages')
    .value()

  return messages
}

const user = (object, args, context, info) => {
  verifyLoggedIn(context)
  const user = context.db.get('users')
    .find({ id: args.id})
    .value()

  return user
}

const users = (object, args, context, info) => {
  verifyLoggedIn(context)
  const users = context.db.get('users')
    .value()

  return users
}
  
const resolvers = {
  Query: {
    user,
    users,
    message,
    messages
  },
  Mutation: {
    createUser,
    followUser,
    unfollowUser,
    login,
    postMessage,
    editMessage,
    deleteMessage
  },
  Message: {
    user: (parent, args, context, info) => {
      const userItem = getUserById(context, parent.user)
      const user = _.omit(userItem, ['passwordHash'])
      return user
    }
  },
  User: {
    messages: (parent, args, context, info) => {
      const userMessages = getMessagesByUser(context, parent.id)
      return userMessages
    },
    following: (parent, args, context, info) => {
      const followingUsers = context.db.get('users')
        .filter((user) => {
          return parent.following.includes(user.id)
        })
        .value()
      return followingUsers
    }
  }
};

module.exports = resolvers