const { createClient } = require('redis');
const model = require('./postgreSQL/model/index.js');

const redisClient = createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

module.exports = {
  getQuestions(req, res) {
    /* eslint prefer-const: 0 */
    let { product_id, page, count } = req.query;
    page = page || 1;
    count = count || 5;
    // console.time();
    redisClient.get(`product-${product_id}`)
      .then((resultCache) => {
        if (resultCache) {
          console.log('using cache for the product id');
          res.status(200).send(JSON.parse(resultCache));
        } else {
          return model.questions.queryQuestions(product_id, page, count)
            .then((result) => {
              // console.timeEnd();
              const resultObj = {
                product_id,
                results: result.rows,
              };
              res.status(200).send(resultObj);
              return redisClient.set(`product-${product_id}`, JSON.stringify(resultObj))
                .then(() => (console.log('cache set for the product id')));
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  addQuestion(req, res) {
    const {
      product_id, body, name, email,
    } = req.body;
    model.questions.insertQuestion(product_id, body, name, email)
      .then(() => {
        console.log('The question was inserted into both table');
        res.status(200).send('The question was added');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  getAnswers(req, res) {
    let { page, count } = req.query;
    const { question_id } = req.params;
    page = page || 1;
    count = count || 5;
    redisClient.get(`question-${question_id}`)
      .then((resultCache) => {
        if (resultCache) {
          console.log('using cache for the question id');
          res.status(200).send(JSON.parse(resultCache));
        } else {
          return model.answers.queryAnswers(question_id, page, count)
            .then((result) => {
              const resultObj = {
                question: question_id,
                page,
                count,
                results: result.rows,
              };
              res.status(200).send(resultObj);
              return redisClient.set(`question-${question_id}`, JSON.stringify(resultObj))
                .then(() => (console.log('cache set for the question id')));
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  addAnswer(req, res) {
    let {
      body, name, email, photos,
    } = req.body;
    const { question_id } = req.params;
    model.answers.insertAnswer(question_id, body, name, email, photos)
      .then(() => {
        console.log('The answer was inserted into answers, photos, questions_answers tables');
        res.status(200).send('The answer was added');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  reportQuestion(req, res) {
    const { question_id } = req.params;
    model.questions.reportQuestion(question_id)
      .then(() => {
        console.log('The question reported in both tables');
        res.status(200).send('The question was reported');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  markQuestionHelpful(req, res) {
    const { question_id } = req.params;
    model.questions.markQuestionHelpful(question_id)
      .then(() => {
        console.log('The question marked in both tables');
        res.status(200).send('The question was marked');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  markAnswerHelpful(req, res) {
    const { answer_id } = req.params;
    model.answers.markAnswerHelpful(answer_id)
      .then(() => {
        console.log('The answer marked in both tables');
        res.status(200).send('The answer was marked');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },

  reportAnswer(req, res) {
    const { answer_id } = req.params;
    model.answers.reportAnswer(answer_id)
      .then(() => {
        console.log('The answer was deleted in questions_answers table');
        res.status(200).send('The answer was reported');
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send();
      });
  },
};
