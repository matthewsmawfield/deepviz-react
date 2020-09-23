import React from 'react';
import {vars} from './Vars.js';
import * as parseData from './parse-data.js';
import Summary from './components/Summary/Summary.js';
import './App.css';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    // parse and organise JSON data
    parseData.parseData();

    // set initial date range state
    this.state = {
      dateFrom: vars.dateRange[0].toLocaleDateString(),
      dateTo: vars.dateRange[1].toLocaleDateString()
    }

    // create references
    this.summary = React.createRef();
  }

  // button handler - select random date range then update summary with new calculated totals. 
  updateSummary = () => {

    // randomise date range
    vars.dateRange[0] = new Date(2019,Math.round(Math.random()*3)+9,Math.round(Math.random()*28));    
    vars.dateRange[1] = new Date(2020,Math.round(Math.random()*7),Math.round(Math.random()*28));

    this.setState({ 
      dateFrom: vars.dateRange[0].toLocaleDateString(), 
      dateTo: vars.dateRange[1].toLocaleDateString() 
    });

    // update summary
    this.summary.current.update();

  }

  render() {
    return (
      <div id="layout">
        <h2>App.js</h2>
        Selected date range: {this.state.dateFrom} to {this.state.dateTo}  <br/><br/>
        <Summary ref={this.summary}/>
        <div id="updateButton" onClick={this.updateSummary}>update summary using random date range</div>
      </div>
    );
  }
}
