declare namespace Picturefill {
  interface EvaluateArg {
    // If you dynamically change the srcset, sizes attributes, or modify
    // source elements, please use this reevaluate option
    reevaluate?: boolean;

    // An array of `img` elements you'd like Picturefill to evaluate.
    elements: Array<Element> | NodeList;
  }

  interface Constructor {
    (arg: EvaluateArg): void;
  }
}

declare var picturefill: Picturefill.Constructor;

declare module 'picturefill' {
  export = picturefill;
}
