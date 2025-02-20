export type keys = {
  // ... all the key a tag have
  title?: string;
  nodeValue?: string;
};

export type ReactElement = {
  // ownner,key,ref
  type: string;
  props: keys & {
    children: ReactElement[];
  };
};

export type Fiber = ReactElement & {
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  dom: Node | null;
};
