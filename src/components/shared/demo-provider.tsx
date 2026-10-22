"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { DemoData, Lead, RecordCollection } from "@/types/crm";

const collections: RecordCollection[] = [
  "leads",
  "contacts",
  "companies",
  "deals",
  "activities",
  "projects",
];

const emptyData: DemoData = {
  owners: [],
  leads: [],
  contacts: [],
  companies: [],
  deals: [],
  activities: [],
  projects: [],
};

type PendingWrite = {
  collection: RecordCollection;
  id: string;
  record: Record<string, unknown>;
  method: "POST" | "PATCH";
};

type CrmContextValue = {
  data: DemoData;
  setData: Dispatch<SetStateAction<DemoData>>;
  createLead: (lead: Lead) => Promise<Lead>;
  deleteRecord: (collection: RecordCollection, id: string) => Promise<boolean>;
  loading: boolean;
  saving: boolean;
  error: string;
  retry: () => Promise<void>;
};

const CrmContext = createContext<CrmContextValue | null>(null);

async function responseError(response: Response) {
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // The response may not contain JSON.
  }
  return `The CRM request failed (${response.status}).`;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef(data);
  const pendingWrites = useRef(new Map<string, PendingWrite>());
  const inFlightKey = useRef<string | null>(null);
  const flushPromise = useRef<Promise<void> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/crm", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const loaded = await response.json() as DemoData;
      dataRef.current = loaded;
      setState(loaded);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load CRM records.");
    } finally {
      setLoading(false);
    }
  }, []);

  const flushPending = useCallback(async () => {
    if (flushPromise.current) return flushPromise.current;

    setSaving(true);
    const flush = (async () => {
      try {
        while (pendingWrites.current.size > 0) {
          const [key, operation] = pendingWrites.current.entries().next().value as [string, PendingWrite];
          const url = operation.method === "POST"
            ? `/api/crm/${operation.collection}`
            : `/api/crm/${operation.collection}/${encodeURIComponent(operation.id)}`;
          const body = operation.method === "POST"
            ? operation.record
            : Object.fromEntries(Object.entries(operation.record).filter(([field]) => field !== "id"));
          inFlightKey.current = key;
          let response: Response;
          try {
            response = await fetch(url, {
              method: operation.method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
          } finally {
            inFlightKey.current = null;
          }
          if (response.status === 404 && operation.method === "PATCH") {
            response = await fetch(`/api/crm/${operation.collection}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(operation.record),
            });
          }
          if (!response.ok) throw new Error(await responseError(response));
          if (pendingWrites.current.get(key) === operation) pendingWrites.current.delete(key);
        }
        setError("");
        setSaving(false);
      } catch (writeError) {
        setError(writeError instanceof Error ? writeError.message : "Unable to save the CRM change.");
        setSaving(false);
      }
    })();

    flushPromise.current = flush;
    try {
      await flush;
    } finally {
      flushPromise.current = null;
    }
  }, []);

  const retry = useCallback(async () => {
    if (pendingWrites.current.size > 0) {
      await flushPending();
      return;
    }
    setLoading(true);
    await loadData();
  }, [flushPending, loadData]);

  const createLead = useCallback(async (lead: Lead) => {
    setSaving(true);
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const savedLead = await response.json() as Lead;
      if (savedLead.id !== lead.id) {
        throw new Error("The CRM server did not confirm the saved lead.");
      }
      const next = { ...dataRef.current, leads: [savedLead, ...dataRef.current.leads] };
      dataRef.current = next;
      setState(next);
      setError("");
      return savedLead;
    } catch (createError) {
      const message = createError instanceof TypeError
        ? "Unable to reach the CRM server. Check your connection and try again."
        : createError instanceof Error ? createError.message : "Unable to save the lead.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteRecord = useCallback(async (collection: RecordCollection, id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      const next = {
        ...dataRef.current,
        [collection]: dataRef.current[collection].filter((record) => record.id !== id),
      };
      dataRef.current = next;
      setState(next);
      setError("");
      return true;
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the CRM record.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/crm", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json() as Promise<DemoData>;
      })
      .then((loaded) => {
        if (!active) return;
        dataRef.current = loaded;
        setState(loaded);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load CRM records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setData: Dispatch<SetStateAction<DemoData>> = useCallback((action) => {
    const previous = dataRef.current;
    const next = typeof action === "function" ? action(previous) : action;
    dataRef.current = next;
    setState(next);

    for (const collection of collections) {
      const previousById = new Map(previous[collection].map((record) => [record.id, record]));
      for (const record of next[collection]) {
        const oldRecord = previousById.get(record.id);
        if (oldRecord && JSON.stringify(oldRecord) === JSON.stringify(record)) continue;
        const key = `${collection}:${record.id}`;
        const queued = pendingWrites.current.get(key);
        pendingWrites.current.set(key, {
          collection,
          id: record.id,
          record: record as unknown as Record<string, unknown>,
          method: (queued?.method === "POST" && inFlightKey.current !== key) || !oldRecord ? "POST" : "PATCH",
        });
      }
    }

    if (pendingWrites.current.size > 0) void flushPending();
  }, [flushPending]);

  return (
    <CrmContext.Provider value={{ data, setData, createLead, deleteRecord, loading, saving, error, retry }}>
      {children}
    </CrmContext.Provider>
  );
}

export function useDemoStore() {
  const value = useContext(CrmContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoProvider");
  return value;
}
