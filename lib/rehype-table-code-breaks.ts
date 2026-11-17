// Round-2 judges found mid-word code breaks in the quick start's step 6 table.
type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

export default function rehypeTableCodeBreaks() {
  return (tree: Node): void => {
    function walk(node: Node, inCell = false, inPre = false): void {
      if (!node.children) return;
      if (node.type === 'element') {
        inCell ||= node.tagName === 'td' || node.tagName === 'th';
        inPre ||= node.tagName === 'pre';
        if (node.tagName === 'code' && inCell && !inPre) {
          node.children = node.children.flatMap((child): Node[] => {
            if (child.type !== 'text') return [child];
            const parts = child.value!.split(/(?<=\.)(?=[\s\S])|(?<=[a-z])(?=[A-Z])/);
            return parts.flatMap((value, index): Node[] => [
              ...(index > 0 ? [{ type: 'element', tagName: 'wbr', properties: {}, children: [] }] : []),
              { type: 'text', value },
            ]);
          });
        }
      }
      for (const child of node.children) walk(child, inCell, inPre);
    }
    walk(tree);
  };
}
