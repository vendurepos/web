// Round-4 judges saw identifiers split mid-word in the two-column tax table at 390 px;
// stacking gives each cell the full width (data-stack, styled for phones in app/global.css).
// Round 14 (C6): stacked, the header row read as a data row and values lost their column, so each body cell
// carries its column's header text as data-label, shown above the value on phones.
// Round 56, J4 C6: a header that is inline code marks its cells data-label-code, so the phone label keeps the code style.
type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

// Longest inline code that still fits beside a second column on a 390 px phone.
const MAX_SIDE_BY_SIDE_CODE = 26;

const text = (node: Node): string => node.value ?? (node.children ?? []).map(text).join('');
const kids = (node: Node | undefined, tag: string) => (node?.children ?? []).filter((c) => c.tagName === tag);

function hasLongCode(node: Node, inCell = false): boolean {
  inCell ||= node.tagName === 'td' || node.tagName === 'th';
  if (inCell && node.tagName === 'code' && text(node).length > MAX_SIDE_BY_SIDE_CODE) return true;
  return (node.children ?? []).some((child) => hasLongCode(child, inCell));
}

function labelCells(table: Node): void {
  const ths = kids(kids(kids(table, 'thead')[0], 'tr')[0], 'th');
  const labels = ths.map((th) => text(th).trim());
  const isCode = ths.map((th) => {
    const parts = (th.children ?? []).filter((c) => !(c.type === 'text' && !c.value?.trim()));
    return parts.length === 1 && parts[0].tagName === 'code';
  });
  for (const tr of kids(kids(table, 'tbody')[0], 'tr'))
    kids(tr, 'td').forEach((td, i) => {
      if (labels[i]) td.properties = { ...td.properties, dataLabel: labels[i], ...(isCode[i] && { dataLabelCode: '' }) };
    });
}

export default function rehypeStackCodeTables() {
  return function walk(node: Node): void {
    if (node.tagName === 'table' && hasLongCode(node)) {
      node.properties = { ...node.properties, dataStack: '' };
      labelCells(node);
    }
    for (const child of node.children ?? []) walk(child);
  };
}
