export function pageMeta(title: string, description: string) {
  const full = `${title} — Internship Drive · Equinox 2K26`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
    ],
  };
}
