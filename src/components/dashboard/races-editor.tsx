"use client";

import { useState } from "react";

import { FormField } from "@/components/dashboard/form-field";
import {
  raceField,
  type DashboardFormState,
  type RaceDraft,
} from "@/lib/dashboard";

export type EditableRace = RaceDraft & {
  hasOrders: boolean; // can't be removed; capacity can't drop below sold
  reserved: number; // spots held by paid and pending orders
};

type Row = { key: number; race?: EditableRace };

// Race rows inside the event form. Each row keeps its `key` for its whole
// life, so field names (`race{key}_name`) and server errors stay attached to
// the same row when others are added or removed. Remount it (via `key`) when
// the saved races change, so new rows pick up their database ids.
export function RacesEditor({
  races,
  state,
}: {
  races: EditableRace[];
  state: DashboardFormState;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    races.length
      ? races.map((race, key) => ({ key, race }))
      : [{ key: 0 }],
  );
  const [nextKey, setNextKey] = useState(Math.max(races.length, 1));
  const error = state.fieldErrors?.races;

  return (
    <fieldset className="stack gap-4">
      <legend className="mb-1 text-xl md:text-2xl">Races</legend>
      <p className="meta -mt-2">
        Each race is a ticket with its own price and number of spots.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}

      {rows.map(({ key, race }, i) => (
        <div key={key} className="rounded-lg border border-line p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-semibold text-ink">
              {race?.name || `Race ${i + 1}`}
            </p>
            {race?.hasOrders ? (
              <span className="meta text-xs">Has registrations</span>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={rows.length === 1}
                onClick={() => setRows(rows.filter((row) => row.key !== key))}
              >
                Remove
              </button>
            )}
          </div>
          {race?.id && (
            <input type="hidden" name={raceField(key, "id")} value={race.id} />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              className="sm:col-span-2"
              name={raceField(key, "name")}
              label="Name"
              placeholder="Half marathon"
              state={state}
              defaultValue={race?.name}
            />
            <FormField
              name={raceField(key, "km")}
              label="Distance (km)"
              inputMode="decimal"
              state={state}
              defaultValue={race ? String(race.km) : ""}
            />
            <FormField
              name={raceField(key, "price")}
              label="Price (₱)"
              inputMode="numeric"
              hint="0 = free"
              state={state}
              defaultValue={race ? String(race.price) : ""}
            />
            <FormField
              name={raceField(key, "startTime")}
              label="Flag-off"
              type="time"
              state={state}
              defaultValue={race?.startTime}
            />
            <FormField
              name={raceField(key, "cutoff")}
              label="Cut-off"
              placeholder="3 hours"
              state={state}
              defaultValue={race?.cutoff}
            />
            <FormField
              name={raceField(key, "minAge")}
              label="Minimum age"
              inputMode="numeric"
              hint="0 = all ages"
              state={state}
              defaultValue={race ? String(race.minAge) : "0"}
            />
            <FormField
              name={raceField(key, "capacity")}
              label="Total spots"
              inputMode="numeric"
              hint={race?.reserved ? `${race.reserved} taken` : undefined}
              state={state}
              defaultValue={race ? String(race.capacity) : ""}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-secondary w-fit"
        onClick={() => {
          setRows([...rows, { key: nextKey }]);
          setNextKey(nextKey + 1);
        }}
      >
        Add race
      </button>
    </fieldset>
  );
}
