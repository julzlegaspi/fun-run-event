// Seeds the sample events. Re-runnable: events with these slugs are replaced.
// Run with `npm run db:seed`.
import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { events, races } from "@/db/schema";
import { unsplash, type RunEvent } from "@/lib/events";

type SeedEvent = Omit<RunEvent, "priceFrom" | "races"> & {
  featured?: boolean;
  races: Omit<RunEvent["races"][number], "id">[];
};

const seedEvents: SeedEvent[] = [
  {
    slug: "sunrise-bay-10k",
    featured: true,
    title: "Sunrise Bay 10K",
    category: "10K",
    distance: "10 km",
    startsAt: "2026-11-15T06:00:00+08:00",
    venue: "Seaside Boulevard",
    area: "Pasay City",
    image: {
      src: unsplash("1667781838690-5f32ea0ccea6"),
      alt: "Runners' feet on a confetti-strewn road during a race",
    },
    status: "Selling fast",
    organizer: "Bayfront Running Club",
    races: [
      { name: "5K Fun Run", km: 5, price: 950, startTime: "06:30", cutoff: "1 hr", minAge: 8, spotsLeft: 140 },
      { name: "10K Run", km: 10, price: 1350, startTime: "06:00", cutoff: "1 hr 45 min", minAge: 14, spotsLeft: 62 },
    ],
    address: "Seaside Boulevard, Bay City, Pasay City, Metro Manila",
    about: [
      "A flat, fast loop along the Manila Bay seaside, flagged off before dawn so you run in the cool of early morning and finish as the sun clears the city skyline. The course is fully closed to traffic, with wide lanes that make it a great first 10K or a shot at a personal best.",
      "Pacers run every 5 minutes from 50 to 90 minutes, and the finish village has a breakfast market, a stretching zone and photo walls for your crew.",
    ],
    included: ["Race bib with timing chip", "Finisher medal", "Technical tee", "Breakfast market voucher", "Free race photos"],
  },
  {
    slug: "colour-splash-5k",
    title: "Colour Splash 5K",
    category: "Colour run",
    distance: "5 km",
    startsAt: "2026-11-22T08:00:00+08:00",
    venue: "Quezon Memorial Circle",
    area: "Quezon City",
    image: {
      src: unsplash("1496024840928-4c417adf211d"),
      alt: "A crowd throwing clouds of yellow and blue colour powder",
    },
    status: "Almost full",
    organizer: "Splash Events",
    races: [
      { name: "3K Family Splash", km: 3, price: 750, startTime: "08:30", cutoff: "1 hr", minAge: 4, spotsLeft: 48 },
      { name: "5K Colour Run", km: 5, price: 1100, startTime: "08:00", cutoff: "1 hr 15 min", minAge: 10, spotsLeft: 23 },
    ],
    address: "Quezon Memorial Circle, Elliptical Road, Diliman, Quezon City, Metro Manila",
    about: [
      "Run, jog or dance through four colour stations, each blasting a different shade of plant-based powder. Nobody is timed, so come in costume and take it as slowly as you like.",
      "The finish line turns into a foam party with a live DJ, so pack a change of clothes for the ride home.",
    ],
    included: ["White race tee", "Colour powder packet", "Sunglasses and bandana", "Finisher medal", "Post-run foam party"],
  },
  {
    slug: "neon-nights-run",
    title: "Neon Nights City Run",
    category: "Night run",
    distance: "8 km",
    startsAt: "2026-11-28T19:30:00+08:00",
    venue: "Pasig River Esplanade",
    area: "Binondo, Manila",
    image: {
      src: unsplash("1706459418431-f68031d1b006"),
      alt: "A runner sprinting past streaks of city light at night",
    },
    status: "New",
    organizer: "After Dark Athletics",
    races: [
      { name: "4K Glow Jog", km: 4, price: 850, startTime: "20:00", cutoff: "1 hr", minAge: 8, spotsLeft: 180 },
      { name: "8K Night Run", km: 8, price: 1250, startTime: "19:30", cutoff: "1 hr 30 min", minAge: 16, spotsLeft: 95 },
    ],
    address: "Pasig River Esplanade, Binondo, Manila, Metro Manila",
    about: [
      "When the city cools down, the river lights up. This night run follows the Pasig past Jones Bridge and the old Binondo waterfront, with LED arches and DJ booths every kilometre.",
      "Glow sticks and LED armbands come in your race pack, and the finish line opens onto a late-night supper market.",
    ],
    included: ["Race bib with timing chip", "LED armband and glow sticks", "Finisher medal", "Supper market voucher"],
  },
  {
    slug: "wawa-ridge-trail-12k",
    title: "Wawa Ridge Trail 12K",
    category: "Trail",
    distance: "12 km",
    startsAt: "2026-12-06T06:00:00+08:00",
    venue: "Wawa Dam Trailhead",
    area: "Rodriguez, Rizal",
    image: {
      src: unsplash("1501434580496-9c7ec510cbf8"),
      alt: "A runner on a winding mountain trail above a lake",
    },
    organizer: "Ridgeline Trail Co.",
    races: [
      { name: "6K Trail Taster", km: 6, price: 1200, startTime: "07:00", cutoff: "1 hr 45 min", minAge: 12, spotsLeft: 120 },
      { name: "12K Ridge Trail", km: 12, price: 1650, startTime: "06:30", cutoff: "3 hr", minAge: 16, spotsLeft: 74 },
      { name: "21K Ridge Ultra-Lite", km: 21, price: 2450, startTime: "06:00", cutoff: "4 hr 30 min", minAge: 18, spotsLeft: 31 },
    ],
    address: "Wawa Dam, Barangay San Rafael, Rodriguez, Rizal",
    about: [
      "Swap tarmac for packed earth, river crossings and roots on a loop through the Sierra Madre foothills above Wawa Dam. Expect shaded climbs, open ridge sections with views back to the city and a few muddy surprises after rain.",
      "Every distance has marshals and water stations at least every 4 km. Trail shoes are recommended but not required for the 6K.",
    ],
    included: ["Race bib with timing chip", "Trail finisher medal", "Buff headwear", "Post-race recovery meal", "Free race photos"],
  },
  {
    slug: "paws-and-pace",
    title: "Paws & Pace Dog Fun Run",
    category: "Dog-friendly",
    distance: "3 km",
    startsAt: "2026-12-13T08:00:00+08:00",
    venue: "Ayala Triangle Gardens",
    area: "Makati City",
    image: {
      src: unsplash("1762751898137-2b0866ed4223"),
      alt: "A corgi in a costume bounding across the grass",
    },
    status: "Early bird",
    organizer: "Happy Tails Collective",
    races: [
      { name: "1K Puppy Stroll", km: 1, price: 450, startTime: "08:30", cutoff: "45 min", minAge: 0, spotsLeft: 200 },
      { name: "3K Paws & Pace", km: 3, price: 750, startTime: "08:00", cutoff: "1 hr", minAge: 0, spotsLeft: 110 },
    ],
    address: "Ayala Triangle Gardens, Makati Avenue, Makati City, Metro Manila",
    about: [
      "A relaxed, shaded loop through the park that you run with your dog. Water bowls are set out every 500 m and there's a cool-down zone with paddling pools at the finish.",
      "Every dog has to be on a leash and have its vaccinations up to date. Owners get a medal and dogs get a bandana of their own.",
    ],
    included: ["Human race bib", "Dog bandana", "Finisher medal", "Treat bag for your dog", "Pet photo booth"],
  },
  {
    slug: "little-sprinters-dash",
    title: "Little Sprinters Kids Dash",
    category: "Kids",
    distance: "1 km",
    startsAt: "2026-12-19T09:00:00+08:00",
    venue: "Rizal Memorial Track Oval",
    area: "Malate, Manila",
    image: {
      src: unsplash("1700914297434-4dad8d710262"),
      alt: "Children racing around a red running track",
    },
    organizer: "Junior Strides",
    races: [
      { name: "400m Mini Dash", km: 0.4, price: 0, startTime: "09:30", cutoff: "20 min", minAge: 3, spotsLeft: 60 },
      { name: "1K Kids Dash", km: 1, price: 0, startTime: "09:00", cutoff: "30 min", minAge: 6, spotsLeft: 85 },
    ],
    address: "Rizal Memorial Sports Complex, Pablo Ocampo Street, Malate, Manila",
    about: [
      "A first race for little legs, held on a proper running track with a real start gun and a finish arch. Parents can run alongside the 400m dash.",
      "After the races there's a sports carnival with obstacle courses, face painting and medals for every finisher.",
    ],
    included: ["Kids race bib", "Finisher medal", "Snack pack", "Sports carnival access"],
  },
  {
    slug: "subic-bay-half",
    title: "Subic Bay Half Marathon",
    category: "Half marathon",
    distance: "21.1 km",
    startsAt: "2027-01-10T05:30:00+08:00",
    venue: "Subic Bay Boardwalk",
    area: "Subic Bay Freeport, Zambales",
    image: {
      src: unsplash("1667781743417-a8099056261c"),
      alt: "Half marathon runners with race bibs mid-stride",
    },
    status: "Early bird",
    organizer: "Bayside Racing",
    races: [
      { name: "5K Bay Run", km: 5, price: 1000, startTime: "06:30", cutoff: "1 hr", minAge: 10, spotsLeft: 210 },
      { name: "10K Bay Run", km: 10, price: 1500, startTime: "06:00", cutoff: "1 hr 45 min", minAge: 14, spotsLeft: 130 },
      { name: "Half Marathon", km: 21.1, price: 2350, startTime: "05:30", cutoff: "3 hr 30 min", minAge: 16, spotsLeft: 88 },
    ],
    address: "Subic Bay Boardwalk, Waterfront Road, Subic Bay Freeport Zone, Zambales",
    about: [
      "A certified half marathon course that runs along the bay and up onto the forested coastal ridge before a fast downhill finish on the boardwalk.",
      "Results are chip-timed and recognised for qualifying. Hydration points sit every 2.5 km, with isotonic drinks and gels from the 10 km mark.",
    ],
    included: ["Race bib with timing chip", "Finisher medal", "Technical singlet", "Post-race recovery kit", "Free race photos"],
  },
  {
    slug: "new-year-resolution-5k",
    title: "New Year Resolution 5K",
    category: "5K",
    distance: "5 km",
    startsAt: "2027-01-17T07:00:00+08:00",
    venue: "Iloilo River Esplanade",
    area: "Iloilo City",
    image: {
      src: unsplash("1745790289741-12a211a8325d"),
      alt: "A crowd of runners streaming through a sunny city street",
    },
    status: "New",
    organizer: "Northshore Joggers",
    races: [
      { name: "2.5K Walk & Jog", km: 2.5, price: 0, startTime: "07:30", cutoff: "1 hr", minAge: 0, spotsLeft: 300 },
      { name: "5K Resolution Run", km: 5, price: 0, startTime: "07:00", cutoff: "1 hr", minAge: 12, spotsLeft: 160 },
    ],
    address: "Iloilo River Esplanade, Mandurriao, Iloilo City, Iloilo",
    about: [
      "Start the year with a free community run along the Iloilo River. It isn't a race, so walk, jog or run it at whatever pace suits you.",
      "Local running clubs set up stalls at the finish so you can find a group to keep training with for the rest of the year.",
    ],
    included: ["Race bib", "Digital finisher certificate", "Coffee at the finish"],
  },
];

async function main() {
  await db.transaction(async (tx) => {
    await tx.delete(events).where(
      inArray(
        events.slug,
        seedEvents.map((e) => e.slug),
      ),
    );

    for (const { races: eventRaces, image, distance, featured, ...event } of seedEvents) {
      const [{ id }] = await tx
        .insert(events)
        .values({
          ...event,
          distanceLabel: distance,
          startsAt: new Date(event.startsAt),
          imageUrl: image.src,
          imageAlt: image.alt,
          isFeatured: featured ?? false,
          isPublished: true,
        })
        .returning({ id: events.id });

      await tx.insert(races).values(
        eventRaces.map(({ km, ...race }) => ({
          ...race,
          eventId: id,
          distanceKm: km,
        })),
      );
    }
  });

  console.log(`Seeded ${seedEvents.length} events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
