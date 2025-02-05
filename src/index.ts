// const element = <h1 title="Hello"> World </h1>
// const container = document.getElementById("root")
// ReactDOM.render(element,container)

// React transforms this JSX code into JS (Babel), by replacing the tags withe React.createElement(...)
// Render is where React changes the DOM

// Step I: Create a "React.CreateElement"
type ReactElement = {
  type: string;
  props: {
    title: string;
    // ... all the key a tag have
    children: string | ReactElement[]; // children can contain multiple elements basicaly a tree
  };
  // ownner,key,ref
};
const element: ReactElement = {
  type: "h1",
  props: {
    title: "hello",
    children: "World",
  },
};

// Step II: Render the changes to the DOM

const container = document.getElementById("root");

const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children as string;

node.appendChild(text);
container?.appendChild(node);
