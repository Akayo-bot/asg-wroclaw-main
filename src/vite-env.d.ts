/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'lord-icon': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'morph-two-way' | 'boomerang';
        colors?: string;
        stroke?: string;
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
}
