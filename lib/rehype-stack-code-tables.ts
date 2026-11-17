// Round-4 judges saw identifiers split mid-word in the two-column tax table at 390 px;
// stacking gives each cell the full width (data-stack, styled for phones in app/global.css).
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

function hasLongCode(node: Node, inCell = false): boolean {
  inCell ||= node.tagName === 'td' || node.tagName === 'th';
  if (inCell && node.tagName === 'code' && text(node).length > MAX_SIDE_BY_SIDE_CODE) return true;
  return (node.children ?? []).some((child) => hasLongCode(child, inCell));
}

export default function rehypeStackCodeTables() {
  return function walk(node: Node): void {
    if (node.tagName === 'table' && hasLongCode(node)) node.properties = { ...node.properties, dataStack: '' };
    for (const child of node.children ?? []) walk(child);
  };
}
