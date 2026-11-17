import defaultMdxComponents from 'fumadocs-ui/mdx';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { TillFigure } from '@/components/till-figure';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TillFigure,
    pre: (props: ComponentProps<'pre'> & { 'data-language'?: string }) => {
      const language = props['data-language'];
      const labels: Record<string, string> = {
        sh: 'Terminal',
        bash: 'Terminal',
        shell: 'Terminal',
        ts: 'TypeScript',
        tsx: 'TSX',
        js: 'JavaScript',
        json: 'JSON',
        graphql: 'GraphQL',
      };
      const label = language ? labels[language] ?? language.toUpperCase() : 'Code';
      return (
        <CodeBlock {...props} title={label}>
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    ...components,
  };
}
