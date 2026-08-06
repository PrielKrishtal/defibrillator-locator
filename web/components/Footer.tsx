// Sitewide footer: the external links §2 requires everywhere, not just the
// homepage - MDA's map + 3 real LoRa 433MHz purchase sites. All 3 links
// were confirmed live/in-stock/433MHz by direct fetch on 2026-07-12, after
// the original Amazon link went dead stock (brief §11 has the full story).
// The 3 links are admin-editable (site_content, same as the homepage/
// why-volunteer copy) - MDA's map is not, since §2 only asks for "purchase"
// content to be editable.
import { getSiteContent, LORA_LINKS_KEY, DEFAULT_LORA_LINKS, type LoraPurchaseLink } from "@/lib/site-content";

const EXTERNAL_LINK_CLASSES = "text-signal hover:underline";

// A Server Component (no "use client"): reads straight from Mongo, same
// pattern as app/page.tsx, instead of round-tripping through the API route.
export async function Footer() {
  const rawLinks = await getSiteContent(LORA_LINKS_KEY, DEFAULT_LORA_LINKS);
  // Falls back to the defaults on corrupted stored JSON, so a bad write
  // never breaks the sitewide footer.
  let links: LoraPurchaseLink[];
  try {
    links = JSON.parse(rawLinks);
  } catch {
    links = JSON.parse(DEFAULT_LORA_LINKS);
  }

  return (
    // bg-line/20: a tinted overlay of the existing `line` token, not a new
    // color, just enough to read as a distinct region.
    <footer className="border-t border-line bg-line/20 px-6 py-8 text-sm sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-ink/70">מפת דפיברילטורים</h2>
          <a
            href="https://defi.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className={EXTERNAL_LINK_CLASSES}
          >
            {/* Not "המפה של מד״א": it's the community map MDA's own 101
                dispatch center actually uses, not an MDA-hosted property. */}
            איפה דפי? - המפה בה משתמש מוקד מד״א לאיתור דפיברילטורים
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-ink/70">
            רכישת מכשירי LoRa (433MHz)
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL_LINK_CLASSES}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Full-opacity ink and bold, not muted, so this reads clearly
            rather than blending in - ink is the site's own dark-text token. */}
        <div className="border-t border-line pt-4 text-base font-bold text-ink">
          פותח על ידי Priel Krishtal | פרויקט גמר, קורס פיתוח WEB
        </div>
      </div>
    </footer>
  );
}
