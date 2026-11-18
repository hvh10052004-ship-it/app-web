import { siteTypes, type SiteTypeId } from "../data/catalog";

export type Product = {
  id: string;
  name: string;
  price: string;
  note: string;
};

export type Draft = {
  typeId: SiteTypeId;
  templateId: string;
  name: string;
  phone: string;
  headline: string;
  about: string;
  products: Product[];
};

const KEY = "webstudio-draft";
const ACTIVE_KEY = "webstudio-active-type";

const empty: Draft = {
  typeId: "landing",
  templateId: "aura",
  name: "Website của tôi",
  phone: "",
  headline: "",
  about: "",
  products: [],
};

function blank(typeId: SiteTypeId): Draft {
  return { ...empty, typeId, name: "" };
}

function readAll(): Partial<Record<SiteTypeId, Draft>> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Draft | Partial<Record<SiteTypeId, Draft>>;
    if (data && typeof data === "object" && "typeId" in data && typeof data.typeId === "string") {
      const one = data as Draft;
      if (!siteTypes.some((item) => item.id === one.typeId)) return {};
      return { [one.typeId]: { ...empty, ...one } };
    }
    return data as Partial<Record<SiteTypeId, Draft>>;
  } catch {
    return {};
  }
}

export function readDraftOf(typeId: SiteTypeId): Draft {
  const stored = readAll()[typeId];
  const draft = stored ? { ...blank(typeId), ...stored, typeId } : blank(typeId);
  return { ...draft, products: Array.isArray(draft.products) ? draft.products : [] };
}

export function readDraft(): Draft {
  const active = (localStorage.getItem(ACTIVE_KEY) || "landing") as SiteTypeId;
  const typeId = siteTypes.some((item) => item.id === active) ? active : "landing";
  return readDraftOf(typeId);
}

export function writeDraft(next: Draft) {
  const all = readAll();
  all[next.typeId] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  localStorage.setItem(ACTIVE_KEY, next.typeId);
  const saved = readSaved();
  saved[next.typeId] = Boolean(next.name.trim() || next.headline.trim() || next.about.trim() || next.phone.trim() || next.products.some((item) => item.name.trim()));
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

const SAVED_KEY = "webstudio-saved-types";

export function readSaved(): Partial<Record<SiteTypeId, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "{}") as Partial<Record<SiteTypeId, boolean>>;
  } catch {
    return {};
  }
}
