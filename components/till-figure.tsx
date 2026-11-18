import Image from 'next/image';

// A live demo till capture in light and dark, as on the home page (#62).
// public/till/<name>-{light,dark}.png are 1440x900 at deviceScaleFactor 2.
export function TillFigure({ name, alt }: { name: string; alt: string }) {
  const sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px';
  return (
    <figure>
      <Image
        src={`/till/${name}-light.png`}
        width={2880}
        height={1800}
        sizes={sizes}
        className="block dark:hidden rounded-lg border border-fd-border"
        alt={alt}
      />
      <Image
        src={`/till/${name}-dark.png`}
        width={2880}
        height={1800}
        sizes={sizes}
        className="hidden dark:block rounded-lg border border-fd-border"
        alt={alt}
      />
    </figure>
  );
}
