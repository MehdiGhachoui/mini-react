import { ReactElement, keys } from "../types";

function createTextElement(text: string): ReactElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export default function createElement(
  type: string,
  keys: keys,
  ...children: ReactElement[]
): ReactElement {
  return {
    type,
    props: {
      ...keys,
      children: children.map((ch) => {
        return typeof ch === "object" ? ch : createTextElement(ch);
      }),
    },
  };
}
