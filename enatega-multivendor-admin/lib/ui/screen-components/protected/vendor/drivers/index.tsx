'use client';

// Orda — the restaurant's OWN drivers (Husseinahk/orda). One restaurant,
// own fleet, own system: the operator manages their drivers here in the
// store-admin shell (not the marketplace super-admin area). List, add,
// edit, toggle availability, remove. German, restaurant-neutral. Backend
// ops: riders / createRider / editRider / deleteRider (RestaurantAdmin
// scoped via the restaurantSlug claim).

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import {
  GET_RIDERS,
  CREATE_RIDER,
  EDIT_RIDER,
  DELETE_RIDER,
} from '@/lib/api/graphql';

interface IDriver {
  _id: string;
  name: string;
  username?: string;
  phone?: string;
  available?: boolean;
}

interface IForm {
  _id?: string;
  name: string;
  username: string;
  phone: string;
  password: string;
}

const EMPTY: IForm = { name: '', username: '', phone: '', password: '' };

export default function DriversManager() {
  const t = useTranslations();
  const { data, loading, refetch } = useQuery(GET_RIDERS, {
    fetchPolicy: 'network-only',
  });
  const [createRider] = useMutation(CREATE_RIDER);
  const [editRider] = useMutation(EDIT_RIDER);
  const [deleteRider] = useMutation(DELETE_RIDER);

  const [form, setForm] = useState<IForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drivers: IDriver[] = useMemo(
    () => data?.riders ?? [],
    [data]
  );

  const isEdit = !!form._id;

  const resetForm = () => {
    setForm(EMPTY);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim() || !form.username.trim()) {
      setError(t('Name and username are required'));
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError(t('A password is required for a new driver'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const riderInput: Record<string, unknown> = {
        name: form.name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        available: true,
      };
      // Never blank an existing password: only send it when one was typed.
      if (form.password.trim()) riderInput.password = form.password.trim();
      if (isEdit) {
        riderInput._id = form._id;
        await editRider({ variables: { riderInput } });
      } else {
        await createRider({ variables: { riderInput } });
      }
      await refetch();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('Something went wrong')
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailable = async (d: IDriver) => {
    if (busy) return;
    setBusy(true);
    try {
      // Flip via editRider (RestaurantAdmin-scoped) — robust + no extra op.
      await editRider({
        variables: {
          riderInput: {
            _id: d._id,
            name: d.name,
            username: d.username,
            phone: d.phone ?? '',
            available: !d.available,
          },
        },
      });
      await refetch();
    } catch {
      /* surfaced via the list re-read */
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d: IDriver) => {
    if (busy) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(t('Remove this driver?') + `\n\n${d.name}`)
    )
      return;
    setBusy(true);
    try {
      await deleteRider({ variables: { id: d._id } });
      await refetch();
      if (form._id === d._id) resetForm();
    } catch {
      /* surfaced via the list re-read */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t('Drivers')}</h1>
        <p className="text-sm text-gray-500">
          {t('Your own delivery drivers')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-xl border bg-white p-4 lg:col-span-1"
        >
          <h2 className="mb-3 font-semibold text-gray-800">
            {isEdit ? t('Edit driver') : t('Add driver')}
          </h2>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={t('Name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={t('Username')}
              autoComplete="off"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={t('Phone')}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              type="password"
              autoComplete="new-password"
              placeholder={
                isEdit
                  ? t('New password (leave blank to keep)')
                  : t('Password')
              }
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isEdit ? t('Save') : t('Add driver')}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm"
                >
                  {t('Cancel')}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* List */}
        <div className="lg:col-span-2">
          {loading && (
            <p className="text-sm text-gray-400">{t('Loading')} …</p>
          )}
          {!loading && drivers.length === 0 && (
            <p className="rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-400">
              {t('No drivers yet')}
            </p>
          )}
          <div className="flex flex-col gap-3">
            {drivers.map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {d.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {d.username}
                    {d.phone ? ` · ${d.phone}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleAvailable(d)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      d.available
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {d.available ? t('Available') : t('Unavailable')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setForm({
                        _id: d._id,
                        name: d.name,
                        username: d.username ?? '',
                        phone: d.phone ?? '',
                        password: '',
                      })
                    }
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs"
                  >
                    {t('Edit')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(d)}
                    className="rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    {t('Remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
