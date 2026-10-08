"use client";

import { useActionState } from "react";

import {
  addOrganizerAction,
  deleteEventAction,
} from "@/app/dashboard/events/[slug]/actions";
import { SubmitButton } from "@/components/auth/auth-form";
import { FormAlert, FormField } from "@/components/dashboard/form-field";

export function AddOrganizerForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(addOrganizerAction, {});
  return (
    <form action={formAction} className="stack gap-3" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <FormAlert state={state} />
      <div className="flex flex-wrap items-end gap-3">
        <FormField
          className="min-w-0 flex-1 basis-64"
          name="email"
          label="Add an organizer by email"
          type="email"
          autoComplete="off"
          hint="They need a Fun Run account first."
          state={state}
        />
        <SubmitButton className="btn btn-secondary" pendingLabel="Adding…">
          Add
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteEventForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(deleteEventAction, {});
  return (
    <form
      action={formAction}
      className="stack gap-3"
      onSubmit={(e) => {
        if (!confirm("Delete this event and its races? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <FormAlert state={state} />
      <SubmitButton
        className="btn btn-secondary w-fit border-danger/40 text-danger"
        pendingLabel="Deleting…"
      >
        Delete event
      </SubmitButton>
    </form>
  );
}
