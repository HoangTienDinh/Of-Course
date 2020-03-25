import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@material-ui/core";
import axios from "axios";
import TestCard from "../StudyRoutes/TestGame/TestCard";
import "../../../styles/Game.css";
import Stopwatch from "./Stopwatch";
import ProgressBar from "./ProgressBar";

const { randomSelection, shuffle } = require("./TestGame/Helpers");

export default function Test() {
  const [cards, setCards] = useState([]);
  const [start, setStart] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [currentCard, setCurrentCard] = useState(-1);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState({});

  const { id } = useParams();

  useEffect(() => {
    axios.get(`/api/study/${id}/test`).then(res => {
      setCards(shuffle(res.data.cards));
      setCurrentCard(0);
    });
  }, []);

  useEffect(() => {
    setAnswers(shuffle(randomSelection(currentCard, cards)));
  }, [currentCard]);

  const TestCards = cards.map(result => {
    return (
      <TestCard
        answered={answered}
        key={result.id}
        question={result.front}
        image={result.image_url}
        hint={result.hint}
        answer={result.back}
        resources={result.resource}
      />
    );
  });

  const answerHandler = id => {
    if (id === cards[currentCard].id) {
      setCorrect({ ...correct, [cards[currentCard].id]: true });
    } else {
      setCorrect({ ...correct, [cards[currentCard].id]: false });
    }
  };

  const submitHandler = () => {
    setAnswered(true);
  };

  const RandomAnswers = answers.map(result => {
    if (
      answered &&
      correct[Object.keys(correct)[Object.keys(correct).length - 1]]
    ) {
      return (
        <Button
          style={{ color: "green" }}
          disabled={true}
          onClick={() => answerHandler(result.id)}
          key={result.id}
        >
          {result.back}
        </Button>
      );
    } else {
      return (
        <Button onClick={() => answerHandler(result.id)} key={result.id}>
          {result.back}
        </Button>
      );
    }
  });

  const handleNextCard = () => {
    setAnswered(false);
    if (currentCard === TestCards.length - 1) {
      return;
    }
    setCurrentCard(currentCard + 1);
  };

  const startHandler = () => {
    if (start === false) {
      return (
        <div className="start-container">
          <Button onClick={() => setStart(true)}>Start Test</Button>
          <h1 className="start-message">Are you ready to ace this test?!</h1>
        </div>
      );
    } else if (start === true) {
      const startTime = Date.now();

      return (
        <>
          <Stopwatch
            startTimer={startTime}
            answers={correct}
            cards={cards}
            game="test"
          />
          <div className="game-box">{TestCards[currentCard]}</div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-evenly" }}>
              {RandomAnswers}
            </div>
            <div style={{ display: "flex", justifyContent: "space-evenly" }}>
              <Button onClick={submitHandler}>Submit</Button>
              <Button onClick={handleNextCard}>Next Answer</Button>
            </div>
          </div>
          <ProgressBar current={currentCard + 1} length={TestCards.length} />
        </>
      );
    }
  };

  return (
    <div className="game-landing-page">
      <h2>{`Test for deck with id: ${id}`}</h2>
      <div>{startHandler()}</div>
    </div>
  );
}
