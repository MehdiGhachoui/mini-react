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

const isProperty = (key: string) => key !== "children" && !isEvent(key)
const isNew=(prev,next)=>(key:string)=> prev[key] !== next[key]
const isGone=(prev,next)=>(key:string)=> !(key in next)

// Special Kind of props "Event listeners" , props that start with "on"
const isEvent = (key:string) => key.startsWith("on")

//TODO... ADD TYPES
function updateDom(dom:Dom,prevProps,nextProps) {
  //Compare the props from the old fiber and the ones from the new fiber

  // Remove old properties tha are gone
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps,nextProps))
    .forEach(name =>{
      dom[name] = ""
    })

  // Add new or changed props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isNew(prevProps,nextProps))
    .forEach(name =>{
      dom[name] = nextProps[name]
    })

  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key:string)=>!(key in nextProps) || isNew(prevProps,nextProps)(key))
    .forEach((name:string)=>{
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })
  
  // Add event listeners
  Object.keys(nextProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps))
  .forEach((name:string) => {
    const eventType = name.toLowerCase().substring(2)
    dom.addEventListener(eventType, nextProps[name])
  })
}

//Once we commit all the work we commit the fiber tree to the dom
function commitRoot() {
  deletions.forEach((f)=>commitWork(f));
  commitWork(wiproot?.child ?? null);
  currentRoot = wiproot as Fiber;
  wiproot = null;
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent?.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent?.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate?.props, fiber.props);
  } else if (fiber.effectTag === "DELETE" && fiber.dom !== null) {
    domParent?.removeChild(fiber.dom);
  }
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

//Reference to the last fiber tree commited to the DOM, to help us update and delete nodes
let currentRoot: Fiber | undefined = undefined;

//Keep track of the nodes we want to remove
let deletions: Fiber[] = [];

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

  //Create new fiber:

  //Element are what we want to render to the dom
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  //Search next unitofwork child -> sibling -> uncle ...
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent as Fiber;
  }
}

// Reconcile the old Fibers with the new element
function reconcileChildren(fiber: Fiber, elements: ReactElement[]) {
  //elements is what we want to render to the DOM
  //fiber is what was rendered last time
  
  //Compare them to see if there is any changes to apply to the DOM
  
  let idx = 0;
  //!: telling the compiler that you know best, you are sure it won't be  null or undefined
  //@see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
  let prevSibling!: Fiber;
  // The elements that we rendered last time
  let oldFiber = fiber.alternate && fiber.alternate.child;

  while (idx < elements.length && oldFiber !== null) {
    const element = elements[idx];

    let newFiber!: Fiber;

    //Compare oldFiber the the new element
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      //Keep the DOM node just update it with new props
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        parent: fiber,
        child: null,
        sibling: null,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      // Create new DOM node
      newFiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        child: null,
        sibling: null,
        dom: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      //Remove the old node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    //Add it to the fiber tree either as child or sibling depending wither it's first child or not
    if (idx === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    idx++;
  }
}
