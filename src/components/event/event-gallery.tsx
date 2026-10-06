import Image from "next/image";

type Photo = { src: string; alt: string };

// One large lead photo with two supporting shots stacked beside it on
// desktop; on small screens only the lead photo shows, edge to edge.
export function EventGallery({ photos }: { photos: Photo[] }) {
  const [lead, ...rest] = photos;

  return (
    <div className="grid gap-2 md:grid-cols-[2fr_1fr] md:grid-rows-2 md:gap-3">
      <div className="relative -mx-4 aspect-[3/2] overflow-hidden sm:mx-0 sm:rounded-xl md:row-span-2 md:aspect-auto md:min-h-[30rem]">
        <Image
          src={lead.src}
          alt={lead.alt}
          fill
          preload
          sizes="(min-width: 1280px) 840px, (min-width: 768px) 66vw, 100vw"
          className="object-cover"
        />
      </div>
      {rest.slice(0, 2).map((photo) => (
        <div
          key={photo.src}
          className="relative hidden overflow-hidden rounded-xl md:block"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1280px) 420px, 33vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
