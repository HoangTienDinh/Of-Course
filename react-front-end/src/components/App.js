import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "../styles/App.css";
import FlashCard from "./FlashCard";
import Header from "./Header";
import Search from "./SearchRoute";
import CardForm from './CardForm'
import Users from './UsersRoute'
import Decks from './DecksRoute';
import Study from './StudyRoute';

export default function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Switch>
          <Route path={'/users/:id'}>
            <Users/>
          </Route>
          <Route path={'/study/:id/test'}>

          </Route>
          <Route path={'/study/:id/match'}>

          </Route>
          <Route path={'/study/:id/original'}>

          </Route>
          <Route path={'/decks/:id'}>

          </Route>
          <Route path={'/search/:tag'}>
            <Search />
          </Route>
          <Route exact path="/">
            <CardForm/>
          </Route>
        </Switch>
        {/* <CardForm /> */}
      </div>
    </Router>
  );
}
