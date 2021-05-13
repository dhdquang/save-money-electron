import { GraphQLDateTime } from 'graphql-iso-date';

import userResolvers from './user';
import messageResolvers from './message';
import categoryResolvers from './category';
import expenditureResolvers from './expenditure';
import insightResolvers from './insight';

const customScalarResolver = {
  Date: GraphQLDateTime,
};

export default [
  customScalarResolver,
  userResolvers,
  messageResolvers,
  categoryResolvers,
  expenditureResolvers,
  insightResolvers,
];
