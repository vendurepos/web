import defaultMdxComponents from 'fumadocs-ui/mdx';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Callout, CalloutContainer, CalloutDescription } from 'fumadocs-ui/components/callout';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { TillFigure } from '@/components/till-figure';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TillFigure,
    // <Callout fold> is a closed native <details> in the callout frame; its text stays in the HTML for search.
    Callout: ({ fold, title, children, ...props }: ComponentProps<typeof Callout> & { fold?: boolean }) =>
      fold ? (
        <CalloutContainer {...props}>
          <details>
            <summary className="cursor-pointer font-medium">{title}</summary>
            <CalloutDescription className="mt-2">{children}</CalloutDescription>
          </details>
        </CalloutContainer>
      ) : (
        <Callout title={title} {...props}>{children}</Callout>
      ),
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
