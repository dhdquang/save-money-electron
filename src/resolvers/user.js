import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import { AuthenticationError, UserInputError } from 'apollo-server';
import moment from 'moment';
import generator from 'generate-password';

import { isAdmin, isAuthenticated } from './authorization';
import Email from '../utils/email';

const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  const token = await jwt.sign({ id, email, username, role }, secret, {
    expiresIn,
  });
  return token;
};

export default {
  Query: {
    users: async (parent, args, { models }) => { const user = await models.User.find(); return user; },
    user: async (parent, { id }, { models }) => { const user = await models.User.findById(id); return user; },
    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }
      const user = await models.User.findById(me.id);
      return user;
    },
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password },
      { models, secret },
    ) => {
      const user = await models.User.create({
        username,
        email,
        password,
        isVerified: false,
        verificationToken: Math.floor(100000 + Math.random() * 900000),
      });
      Email.sendVerifyEmail(email, user.verificationToken);
      return { token: createToken(user, secret, '10m') };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError(
          'No user found with this login credentials.',
        );
      }
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        const forgotPass = await models.User.findOne(
          { forgotToken: password, resetPasswordExpires: { $gt: Date.now() } },
        );
        if (forgotPass) {
          return { token: createToken(user, secret, '1h'), srp: true };
        }
        throw new AuthenticationError('Invalid password.');
      }

      return { token: createToken(user, secret, '1h') };
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { firstname, lastname }, { models, me }) => {
        const user = await models.User.findByIdAndUpdate(
          me.id,
          { firstname, lastname },
          { new: true },
        ); return user;
      },
    ),

    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        const user = await models.User.findById(id);

        if (user) {
          await user.remove();
          return true;
        }
        return false;
      },
    ),

    verifiedEmail: async (parent,
      { verificationToken },
      { models }) => {
      const verified = await models.User.findOneAndUpdate(
        { verificationToken },
        {
          isVerified: true,
          verificationToken: '',
        },
      );
      return Boolean(verified);
    },

    forgotPass: async (parent,
      { email },
      { models }) => {
      const user = await models.User.findOneAndUpdate(
        { email },
        {
          forgotToken: generator.generate({
            length: 10,
            numbers: true,
          }),
          resetPasswordExpires: moment().add(1, 'h'),
        },
        { new: true },
      );
      Email.sendForgotPassword(email, user.forgotToken);
      return Boolean(user);
    },

    resetPassword: combineResolvers(
      isAuthenticated, async (parent,
        { password },
        { models, me }) => {
        const user = await models.User.findById(
          me.id,
        );
        if (!user.forgotToken) {
          throw new AuthenticationError('Invalid password.');
        }
        const userNewPassword = await models.User.findByIdAndUpdate(me.id, {
          password,
          forgotToken: '',
          resetPasswordExpires: undefined,
        },
        { new: true });
        userNewPassword.save();
        return { token: createToken(userNewPassword, process.env.SECRET, '10m') };
      },
    ),

    changePassword: combineResolvers(
      isAuthenticated,
      async (parent, { password, newPassword }, { models, me }) => {
        const user = await models.User.findById(
          me.id,
        );
        const isValid = await user.validatePassword(password);
        if (!isValid) {
          throw new AuthenticationError('Invalid password.');
        }
        const userNewPassword = await models.User.findByIdAndUpdate(me.id,
          { password: newPassword },
          { new: true });
        userNewPassword.save();
        return { token: createToken(userNewPassword, process.env.SECRET, '1h') };
      },
    ),
  },

  User: {
    messages: async (user, args, { models }) => {
      const messages = await models.Message.find({
        userId: user.id,
      }); return messages;
    },
  },
};
