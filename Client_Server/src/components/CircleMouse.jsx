import React, { useState, useEffect, Component } from 'react';
import './CircleMouse.css';

class Circle extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        x: 0,
        y: 0,
        xTarget: 0,
        yTarget: 0,
        xBaby: 0,
        yBaby: 0,
      };
      this.handleMouseMove = this.handleMouseMove.bind(this);
    }
  
    componentDidMount() {
      window.addEventListener('mousemove', this.handleMouseMove);
      this.interval = setInterval(this.moveTowardsTarget.bind(this), 30);
    }
  
    componentWillUnmount() {
      window.removeEventListener('mousemove', this.handleMouseMove);
      clearInterval(this.interval);
    }
  
    handleMouseMove(event) {
      this.setState({
        xTarget: event.clientX,
        yTarget: event.clientY
      });
    }
  
    moveTowardsTarget() {
      const { x, y, xTarget, yTarget, xBaby, yBaby } = this.state;
      this.setState({
        x: (x + ((xTarget - x) / 6)) - 5,
        y: (y + ((yTarget - y) / 6)) - 5,
        xBaby: (xBaby + ((x - xBaby) / 6)) + 2.5,
        yBaby: (yBaby + ((y - yBaby) / 6)) + 2.5,
      });
    }
  
    render() {
        const { x, y, xBaby, yBaby } = this.state;
        return (<>
            <div
            className="circle"
            style={{
                left: x,
                top: y
            }}
            >
            </div>
            <div
            className="circleBaby"
            style={{
                left: xBaby,
                top: yBaby
            }}
            >
            </div>
        </>);
    }
}

export default Circle;