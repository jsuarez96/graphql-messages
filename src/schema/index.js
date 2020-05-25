const { gql } = require('apollo-server')

const typeDefs = gql`
  type User {
    id: ID
    email: String
    phone: String
    messages: [Message]
    following: [User]
  }

  type Message {
    id: ID
    message: String
    user: User
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Query {
    user(id: ID!): User
    users: [User]
    message(id: ID!): Message
    messages: [Message]
  }

  type Mutation {
    createUser(email: String, phone: String, password: String!): AuthPayload
    followUser(id: ID!): User
    unfollowUser(id: ID!): User
    login(email: String, phone: String, password: String!): AuthPayload
    postMessage(message: String!): Message!
    editMessage(id: ID!, newMessage: String!): Message
    deleteMessage(id: ID!): Message
  }
`;

module.exports = typeDefs
