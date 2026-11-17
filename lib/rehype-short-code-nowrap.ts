// Round-3 judges saw hyphenated tokens split on phones; 24 characters fit a 390 px screen.
type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

export default function rehypeShortCodeNowrap() {
  return (tree: Node): void => {
    function textContent(node: Node): string {
      return node.type === 'text' ? node.value! : (node.children ?? []).map(textContent).join('');
    }
    function walk(node: Node, inCell = false, inPre = false): void {
      if (node.type === 'element') {
        inCell ||= node.tagName === 'td' || node.tagName === 'th';
        inPre ||= node.tagName === 'pre';
        if (node.tagName === 'code' && !inCell && !inPre && textContent(node).length <= 24) {
          node.properties ??= {};
          node.properties.dataNowrap = '';
        }
      }
      for (const child of node.children ?? []) walk(child, inCell, inPre);
    }
    walk(tree);
  };
}
