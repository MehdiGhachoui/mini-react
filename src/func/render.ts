import { Fiber, ReactElement } from "../types";

export function createDom(fiber: Fiber) {
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

//Once we commit all the work we commit the fiber tree to the dom
function commitRoot() {
  commitWork(wiproot?.child ?? null);
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent?.dom;
  domParent?.appendChild(fiber.dom as Node);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element: ReactElement, container: HTMLBodyElement) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    child: null,
    parent: null,
    sibling: null,
    type: element.type,
  };

  nextUnitOfWork = wiproot;
}

// CONCURENCY :
//Refactoring the render so that it can handle non [priority-work][user input; animation,..]
//if the element tree is big it will block the main thread; we will have to wait until the render is done.
//We will break the work into units so that the browser can interrupt the rendering if there is high priority work
//And for that we need "fiber tree" data structure @see: https://www.velotio.com/engineering-blog/react-fiber-algorithm

// units are the element that we will render one by one starting from the "container"
let nextUnitOfWork: Fiber | null = null;

// work in progress root; track the root of the fiber tree
let wiproot: Fiber | null = null;

function workLoop(_deadline: any) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork) as Fiber;

    //Check how much time we have until the browser needs to take control again
    shouldYield = _deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wiproot) {
    commitRoot();
  }

  // a setTimeOut run by the browser when the main thread is idle
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber: Fiber) {
  //Create new node and append it to the dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent && fiber.dom) {
    fiber.parent.dom?.appendChild(fiber.dom);
  }

  //Create new fiber
  const elements = fiber.props.children;

  //!: telling the compiler that you know best, you are sure it won't be  null or undefined
  //@see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
  let prevSibling!: Fiber;
  let idx = 0;
  while (idx < elements.length) {
    const element = elements[idx];

    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      child: null,
      sibling: null,
      dom: null,
    };

    //Add it to the fiber tree either as child or sibling depending wither it's first child or not
    if (idx === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    idx++;
  }

  //Search next unitofwork child -> sibling -> uncle ...
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
