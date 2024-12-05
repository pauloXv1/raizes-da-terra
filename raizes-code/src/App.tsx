import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import React from 'react';
import logo from './logo.svg';
import NavBar from './components/layout/navBar/NavBar';
import Footer from "./components/layout/footer/Footer";
import Home from "./components/pages/home/HomePage"

function App() {
  return (
    <Router>
      <NavBar/>
      <Home/>
      <Footer/>
    </Router>
  );
}

export default App;
