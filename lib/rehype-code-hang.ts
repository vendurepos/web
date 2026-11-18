// Round-7 judges saw wrapped code continuations restart at column 0 on phones; app/global.css hangs
// each wrapped line past its own indent, which this records as `--indent` on every indented code line.
type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

export default function rehypeCodeHang() {
  return (tree: Node): void => {
    function textContent(node: Node): string {
      return node.type === 'text' ? node.value! : (node.children ?? []).map(textContent).join('');
    }
    function walk(node: Node, inPre = false): void {
      inPre ||= node.tagName === 'pre';
      // Shiki's hast names the class `class` (a string); hast proper uses `className` (an array).
      const classes = [node.properties?.class, node.properties?.className].flat().join(' ').split(' ');
      if (inPre && node.tagName === 'span' && classes.includes('line')) {
        // Tabs count as 2 columns.
        const indent = Array.from(/^[ \t]*/.exec(textContent(node))![0]).reduce((n, c) => n + (c === '\t' ? 2 : 1), 0);
        if (indent > 0) {
          node.properties!.style = [node.properties!.style, `--indent:${indent}ch`].filter(Boolean).join(';');
        }
        return;
      }
      for (const child of node.children ?? []) walk(child, inPre);
    }
    walk(tree);
  };
}
