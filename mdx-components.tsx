import defaultMdxComponents from 'fumadocs-ui/mdx';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Callout, CalloutDescription } from 'fumadocs-ui/components/callout';
import { ChevronRight } from 'lucide-react';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { TillFigure } from '@/components/till-figure';
import { HostedTillVersion } from '@/components/hosted-till-version';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TillFigure,
    HostedTillVersion,
    // <Callout fold> is a closed native <details> with its text in the HTML for search.
    // Round 52, J4 C5: a fold is a plain bordered disclosure, not a callout frame (no shadow, no coloured rule, no icon).
    // Round 69, J4 C5: a muted chevron that turns when open replaces the browser's black triangle.
    Callout: ({ fold, title, children, ...props }: ComponentProps<typeof Callout> & { fold?: boolean }) =>
      fold ? (
        <details className="group my-4 rounded-lg border border-fd-border px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-fd-muted-foreground transition-transform group-open:rotate-90" />
            {title}
          </summary>
          <CalloutDescription className="mt-2">{children}</CalloutDescription>
        </details>
      ) : (
        <Callout title={title} {...props}>{children}</Callout>
      ),
    pre: (props: ComponentProps<'pre'> & { 'data-language'?: string }) => {
      const language = props['data-language'];
      const labels: Record<string, string> = {
        sh: 'Terminal',
        bash: 'Terminal',
        shell: 'Terminal',
        dotenv: '.env file',
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
