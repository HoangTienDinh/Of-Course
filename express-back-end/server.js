const Express = require('express');
const App = Express();
const BodyParser = require('body-parser');
const PORT = 9001;
require('dotenv').config();
const cookie = require('cookie-session');
const getSQLValues = require('./helpers/getSQLValues');
const getSQLTestQuestions = require('./helpers/getSQLTestQuestions');


//Database setup
const pg = require('pg');
const db = new pg.Client(process.env.DATABASE_URL);

db.connect();

// Middleware
App.use(BodyParser.urlencoded({ extended: false }));
App.use(BodyParser.json())
App.use(Express.static('public'));
App.use(cookie({
  name:'session',
  keys: ['key1']
}));

//Api Routes
const cardsRoutes = require('./routes/cards')
const decksRoutes = require('./routes/decks')
const ratingsRoutes = require('./routes/ratings')
const testquestionsRoutes = require('./routes/testquestions')
const testsRoutes = require('./routes/tests')
const usersRoutes = require('./routes/users')
const tagsRoutes = require('./routes/tags')
const decktagsRoutes = require('./routes/deck_tags');

App.use('/api/cards', cardsRoutes(db));
App.use('/api/decks', decksRoutes(db));
App.use('/api/ratings', ratingsRoutes(db));
App.use('/api/testquestions', testquestionsRoutes(db));
App.use('/api/tests', testsRoutes(db));
App.use('/api/users', usersRoutes(db));
App.use('/api/tags', tagsRoutes(db));
App.use('/api/deck_tags', decktagsRoutes(db))

// GET Routes
//Search Api
App.get('/api/search/:tag', (req, res) => {
  const tag = req.params.tag;
  
  db.query(`
  SELECT * FROM decks
  WHERE id IN (
    SELECT deck_id FROM deck_tags
    WHERE tag_id=(
      SELECT id FROM tags
      WHERE LOWER(name) LIKE '${tag}'
    )
  )
  OR LOWER(name) LIKE '%${tag}%'
  OR description LIKE '%${tag}%'
  OR user_id=(
    SELECT id FROM users
    WHERE LOWER(name) LIKE '%${tag}%'
  )
    `).then((result) => {
    res.send(result.rows)
  }).catch((e) => 
  console.log(e));
});

//Login/Logout API
App.post('/api/login', (req, res) => {
  req.session.userID = 3;
  res.redirect(`/users/${req.session.userID}`)
})
App.post('/api/logout', (req, res) => {
  req.session.userID = null;
  res.redirect(`/`)
})

//Study API
App.get('/api/study/:id', (req, res) => {
  const id = req.params.id
  let data = {};
  db.query(`
  SELECT name FROM tags
  WHERE id IN (SELECT tag_id FROM deck_tags
    WHERE deck_id=${id});
  `).then((result) => {
    data.tags = (result.rows);
    db.query(`
    SELECT * FROM decks
    WHERE id=${id};
    `).then((result) => {
      data.deck = (result.rows[0]);
      db.query(`
      SELECT COUNT(deck_id)
      FROM cards
      WHERE deck_id=${id};
      `).then((result) => {
        data.numOfCards = (result.rows[0].count)
        db.query(`
        SELECT COUNT(user_id) as attempts
        FROM tests
        WHERE user_id=3
        AND deck_id=${id}
        `).then((result) => {
          data.attempts = (result.rows[0].attempts)
          db.query(`
          SELECT user_id, deck_id, avg(time_end - time_start) as average_time
          FROM tests
          WHERE user_id=3
          AND deck_id=${id}
          GROUP BY user_id, deck_id
          `).then((result) => {
            data.averageTime = (result.rows[0].average_time)
            db.query(`
            SELECT card_id, correct, COUNT(card_id) as mostwrong
            FROM testquestions
              WHERE correct=false
              AND card_id IN (SELECT id FROM cards
                WHERE deck_id=${id})
            GROUP BY card_id, correct
            ORDER BY mostwrong DESC LIMIT 1;
            `).then((result) => {
              data.mostWrong = (result.rows[0].mostwrong)
              db.query(`
              SELECT front
              FROM cards
              WHERE id=${result.rows[0].card_id}
              `).then((result) => {
                data.front = (result.rows[0].front)
                db.query(`
                SELECT COUNT(correct) as totalcorrect
                FROM testquestions
                WHERE correct=true
                AND test_id IN (SELECT id FROM tests
                WHERE deck_id=${id}
                AND user_id=3)
                `).then((result) => {
                  data.averageCorrect = (Math.floor((Number(result.rows[0].totalcorrect) / (Number(data.attempts) * Number(data.numOfCards))) * 100))
                  db.query(`
                  SELECT test_id, COUNT(correct) as bestattempt
                  FROM testquestions
                  WHERE correct=true
                  AND test_id IN (SELECT id FROM tests
                  WHERE deck_id=8
                  AND user_id=3)
                  GROUP BY test_id LIMIT 1
                  `).then((result) => {
                    data.bestAttempt = result.rows[0].bestattempt
                    db.query(`
                    SELECT id, time_start, time_end
                    FROM tests
                    WHERE id=${result.rows[0].test_id}
                    `).then((result) => {
                      data.bestAttemptData = result.rows[0]
                      res.send(data);
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  }).catch((e) => {
    console.error(e);
  })
})


//Study Original game API
App.get('/api/study/:id/original', (req, res) => {
  const id = req.params.id;

  let data = {};

  db.query(`
  SELECT name FROM tags
  WHERE id IN (SELECT tag_id FROM deck_tags
    WHERE deck_id=${id})
  `).then((result) => {
    data.tags = (result.rows);
    db.query(`
    SELECT * FROM decks
    WHERE id=${id}
    `).then((result) => {
      data.deck = (result.rows[0]);
      db.query(`
      SELECT * FROM cards
      WHERE deck_id=${id}
      `).then((result) => {
        data.cards = (result.rows)
        console.log(data)
        res.send(data);
      })
    })
  }).catch((e) => {
    console.error(e);
  })
})
//Study Match game API
App.get('/api/study/:id/match', (req, res) => {
  const id = req.params.id;
    let data = {};

  db.query(`
  SELECT name FROM tags
  WHERE id IN (SELECT tag_id FROM deck_tags
    WHERE deck_id=${id})
  `).then((result) => {
    data.tags = (result.rows);
    db.query(`
    SELECT * FROM decks
    WHERE id=${id}
    `).then((result) => {
      data.deck = (result.rows[0]);
      db.query(`
      SELECT * FROM cards
      WHERE deck_id=${id}
      LIMIT 6;
      `).then((result) => {
        data.cards = (result.rows)
        console.log(data)
        res.send(data);
      })
    })
  }).catch((e) => {
    console.error(e);
      })
})


//Study Original game Timestamps
App.post('/api/study/:id/original', (req, res) => {
  const data = JSON.parse(req.body.data)
  const answers = data.answers;
  const id = req.params.id;
  const startTime = data.startTime;
  const endTime = data.endTime;

  data.cards.forEach((card) => {
    if (!(card.id in answers)) {
      answers[card.id] = false
    }
  })

  // id here is DeckId
  db.query(`
  INSERT INTO tests (user_id, deck_id, time_start, time_end)
  VALUES (3, '${id}', '${startTime}', '${endTime}')
  RETURNING *;
  `).then((data) => {
    const testId = data.rows[0].id
    db.query(`
      INSERT INTO testquestions (card_id, test_id, correct)
      VALUES ${getSQLTestQuestions(answers, testId)}
    `)
  }).catch((err) => {
    console.log('here in error', err)
      })
})

//Study test API
App.get('/api/study/:id/test', (req, res) => {
  const id = req.params.id;
    let data = {};

  db.query(`
  SELECT name FROM tags
  WHERE id IN (SELECT tag_id FROM deck_tags
    WHERE deck_id=${id})
  `).then((result) => {
    data.tags = (result.rows);
    db.query(`
    SELECT * FROM decks
    WHERE id=${id}
    `).then((result) => {
      data.deck = (result.rows[0]);
      db.query(`
      SELECT * FROM cards
      WHERE deck_id=${id}
      LIMIT 6;
      `).then((result) => {
        data.cards = (result.rows)
        console.log(data)
        res.send(data);
      })
    })
  }).catch((e) => {
    console.error(e);
      })
})


//Users Decks API
App.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.query(`
  SELECT * FROM decks
  WHERE user_id=${id}
  ORDER BY id DESC;
  `).then((results) => {
    res.send(results.rows);
  }).catch((e) => {
    console.error(e);
  })
});

//New Deck API
App.post('/api/decks/new', (req, res) => {
  const data = JSON.parse(req.body.data)
  const d = data.deckData
  const c = data.cardData
  db.query(`DELETE FROM decks
  WHERE name='${d.title}';
  
  INSERT INTO decks (user_id, name, description, image_url) 
  VALUES (3, '${d.title}', '${d.description}', '${d.image}') RETURNING *;
  `).then((data) => {
    const cardValues = Object.values(c)
    const deckID = data[1].rows[0].id;
    //Get deck_id, front, back, hint, resource, image_url
    db.query(`
    INSERT INTO cards (deck_id, front, image_url, hint, back, resource)
    VALUES ${getSQLValues(deckID, cardValues)}
    `).then((data) => {
    }).catch(e => console.log(e))
  }).catch(e => console.log(e)) 
  res.send(req.body);
})


//Edit Decks API
App.get('/api/decks/:id/edit', (req, res) => {
  const id = req.params.id
  let data = {};
  db.query(`
  SELECT name FROM tags
  WHERE id IN (SELECT tag_id FROM deck_tags
    WHERE deck_id=${id})
  `).then((result) => {
    data.tags = (result.rows);
    db.query(`
    SELECT * FROM decks
    WHERE id=${id}
    `).then((result) => {
      data.deck = (result.rows[0]);
      db.query(`
      SELECT * FROM cards
      WHERE deck_id=${id}
      `).then((result) => {
        data.cards = (result.rows)
        res.send(data);
      })
    })
  }).catch((e) => {
    console.error(e);
  })
})
App.post('/api/decks/:id/edit', (req, res) => {
  const id = req.params.id;
  const data = JSON.parse(req.body.data)
  const d = data.deckData
  const c = data.cardData
  console.log(d.tags)
  if (d.name) {
    d.title = d.name
  }
  if (d.image_url) {
    d.image = d.image_url
  }
  db.query(`UPDATE decks SET 
    name = '${d.title}',
    description = '${d.description}',
    image_url = '${d.image}'
  WHERE id = ${id};
  `).then((data) => {
    const cardValues = Object.values(c)
    // //Get deck_id, front, back, hint, resource, image_url
    db.query(`DELETE FROM cards
    WHERE deck_id = ${id};
    INSERT INTO cards (deck_id, front, image_url, hint, back, resource)
    VALUES ${getSQLValues(id, cardValues)};
    `).then((data) => {
      db.query(`
      INSERT INTO tags (name) VALUES ('${d.tags}');`).then((result) => {
        db.query(`
        INSERT INTO deck_tags (deck_id, tag_id) VALUES
        (${id}, (SELECT id FROM tags ORDER BY id DESC LIMIT 1));`)
      }).catch(e => console.log(e))
    }).catch(e => console.log(e))
  }).catch(e => console.log(e)) 
  res.send(req.body);
})

//Delete deck API
App.post('/api/decks/:id/delete', (req, res) => {
  const id = req.params.id;
  db.query(`DELETE FROM decks
  WHERE id=${id}`).then((res) => {
    console.log(res);
  })
})

// LISTENING ON THIS PORT
App.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Express seems to be listening on port ${PORT} so that's pretty good 👍`);
});