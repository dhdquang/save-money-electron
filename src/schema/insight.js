import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    insight(from:Date, to:Date): Insight
  }

  type Insight {
    charts: [Float]!
    total: Float!
    average: Float!
    max: Float!
    min: Float!
  }
`;
