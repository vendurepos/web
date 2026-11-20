import type { StructuredData } from 'fumadocs-core/mdx-plugins';

// Round 62, J4 C7: the MDX sources are hard-wrapped, so each search snippet joins its lines with one space.
export function joinContentLines(data: StructuredData): StructuredData {
  return {
    headings: data.headings,
    contents: data.contents.map((item) => ({ ...item, content: item.content.replace(/[ \t]*\n[ \t]*/g, ' ') })),
  };
}
