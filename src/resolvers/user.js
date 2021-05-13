import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import { AuthenticationError, UserInputError } from 'apollo-server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import moment from 'moment';

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
        verificationToken: await bcrypt.hash(uuidv4(), 10),
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
        throw new AuthenticationError('Invalid password.');
      }

      return { token: createToken(user, secret, '1h') };
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { username }, { models, me }) => {
        const user = await models.User.findByIdAndUpdate(
          me.id,
          { username },
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
          verificationToken: await bcrypt.hash(uuidv4(), 10),
          resetPasswordExpires: moment().add(1, 'h'),
        },
      );
      Email.sendForgotPassword(email, user.verificationToken);
      return Boolean(user);
    },

    resetPassword: async (parent,
      { token, password },
      { models }) => {
      const user = await models.User.findOneAndUpdate(
        { verificationToken: token, resetPasswordExpires: { $gt: Date.now() } },
        {
          password,
          verificationToken: '',
          resetPasswordExpires: undefined,
        },
      );
      return Boolean(user);
    },

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
        const userNewPassword = await models.User.findByIdAndUpdate(me.id, { password: newPassword }, { new: true });
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
