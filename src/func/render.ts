import { ReactElement } from "../types";

export function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key: string) => key !== "children";

  Object.keys(fiber.props).forEach((name) => {
    dom[name] = fiber.props[name];
  });

  return dom;
}

function render(element: ReactElement, container: HTMLBodyElement) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

// CONCURENCY :
//Refactoring the render so that it can handle non [priority-work][user input; animation,..]
//if the element tree is big it will block the main thread; we will have to wait until the render is done.
//We will break the work into units so that the browser can interrupt the rendering if there is high priority work
//And for that we need "fiber tree" data structure @see: https://www.velotio.com/engineering-blog/react-fiber-algorithm

// units are the element that we will render one by one starting from the "container"
let nextUnitOfWork = null;

function workLoop(_deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    //Check how much time we have until the browser needs to take control again
    shouldYield = _deadline.timeRemaining() < 1;
  }

  // a setTimeOut run by the browser when the main thread is idle
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  //Create new node and append it to the dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild;
  }

  //Create new fiber
  const elements = fiber.props.children;
  let idx = 0;
  let prevSibling = null;
  while (idx < elements.length) {
    const element = elements[idx];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };
    if (idx === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    idx++;
  }
  //TODO return next unit of work
}
