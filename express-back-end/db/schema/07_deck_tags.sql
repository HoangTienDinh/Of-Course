DROP TABLE IF EXISTS deck_tags CASCADE;
CREATE TABLE deck_tags (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE NOT NULL
);