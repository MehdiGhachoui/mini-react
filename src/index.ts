import createElement from "./create";

// const element = <h1 title="Hello"> World </h1> (1)
// const container = document.getElementById("root")
// ReactDOM.render(element,container)

// React transforms this JSX code into JS (Babel), by replacing the tags withe React.createElement(...)
// Render is where React changes the DOM

const MiniReact = {
  createElement,
};

//STEP I: CREATE FUNCTION
//Fix this !!
// TSX :
/** @tsx MiniReact.createElement */
// const element = (<div id="foo"></div>);

// will turn code into this :
const element = MiniReact.createElement(
  "h1",
  { title: "Hello" },
  MiniReact.createElement("World", {})
);

// STEP II: Render Function
