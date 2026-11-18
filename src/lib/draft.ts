import { siteTypes, type SiteTypeId } from "../data/catalog";

export type Draft = {
  typeId: SiteTypeId;
  templateId: string;
  name: string;
  phone: string;
  headline: string;
  about: string;
};

const KEY = "webstudio-draft";

const empty: Draft = {
  typeId: "landing",
  templateId: "aura",
  name: "Website của tôi",
  phone: "",
  headline: "",
  about: "",
};

export function readDraft(): Draft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as Draft;
    if (!siteTypes.some((item) => item.id === data.typeId)) return empty;
    return { ...empty, ...data };
  } catch {
    return empty;
  }
}

export function writeDraft(next: Draft) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
