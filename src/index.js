const { ApolloServer } = require('apollo-server')
const FileAsync = require('lowdb/adapters/FileAsync')
const jwt = require('jsonwebtoken')
const lowdb = require('lowdb')
const resolvers = require('./resolvers')
const typeDefs = require('./schema')

const APP_SECRET = 'algun_secreto'

const getLoggedInUser = (request, db) => {
  let user = null
  try {
    const authHeaders = request.req.headers.authorization
    const token = authHeaders.replace('Bearer ', '')
    const { id } = jwt.verify(token, APP_SECRET)
    user = db.get('users')
      .find({ id })
      .value()
  } catch (err) {} //ignore here in case user is logging in or registering
    
  return user
}

(async () => {
  const DB_PATH = '../data/database.json'
  const db = await lowdb(new FileAsync(DB_PATH))
  const server = new ApolloServer({ typeDefs, resolvers, context: request => {
    const user = getLoggedInUser(request, db)
    return {
      ...request,
      db,
      user,
      secret: APP_SECRET
    }
  }})
  server.listen().then(({ url }) => {
    console.log(`graphQL server listening at: ${url}`)
  })
})()
