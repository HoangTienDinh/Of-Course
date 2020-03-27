DROP TABLE IF EXISTS cards CASCADE;
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  front VARCHAR (255) NOT NULL,
  back VARCHAR (255) NOT NULL,
  hint VARCHAR(255),
  image_url TEXT,
  resource TEXT
);