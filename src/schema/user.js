import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }

  extend type Mutation {
    signUp(
      username: String!
      email: String!
      password: String!
    ): Token!

    signIn(login: String!, password: String!): Token!
    updateUser(firstname: String!, lastname: String!): User!
    deleteUser(id: ID!): Boolean!
    verifiedEmail(verificationToken: String!): Boolean!
    changePassword(password: String!, newPassword: String): Token!
    resetPassword(password: String!): Token!
    forgotPass(email: String!): Boolean!
  }

  type Token {
    token: String!
    srp: Boolean
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String
    firstname: String
    lastname: String
    messages: [Message!]
  }
`;
