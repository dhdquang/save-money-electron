import _ from 'lodash';

export default {
  Query: {
    insight: async (parent, { from, to }, { models, me }) => {
      const expenditures = await models.Expenditure.find({
        user: me._id,
        date: { $gt: from, $lt: to },
      });
      const charts = [];
      let total = 0;
      let max = 0;
      let min = 0;
      const diffTime = Math.abs(+from - +to);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      for (let i = 0; i < diffDays; i += 1) {
        const day = from + i * (1000 * 60 * 60 * 24);
        const chart = 0;
        const expenditureInDay = _.filter(expenditures, (e) => +e.date < day);
        const totalInDay = _.sumBy(expenditureInDay, (e) => e.spending);
        total += totalInDay;
        if (max < totalInDay) max = totalInDay;
        if (min > totalInDay) min = totalInDay;
        charts.push(chart);
      }
      return { charts, total, max, min, average: Math.ceil(total / diffDays) };
    },
  },
};
