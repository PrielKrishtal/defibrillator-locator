// Sitewide footer: the external links §2 requires everywhere, not just the
// homepage - MDA's map + 3 real LoRa 433MHz purchase sites. All 3 links
// were confirmed live/in-stock/433MHz by direct fetch on 2026-07-12, after
// the original Amazon link went dead stock (brief §11 has the full story).
const EXTERNAL_LINK_CLASSES = "text-signal hover:underline";

export function Footer() {
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
            <a
              href="https://www.adafruit.com/product/3232"
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASSES}
            >
              Adafruit LoRa FeatherWing - RFM95W 433MHz
            </a>
            <a
              href="https://www.sparkfun.com/lora-transceiver-module-rfm95cw.html"
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASSES}
            >
              SparkFun - LoRa Transceiver Module RFM95CW
            </a>
            <a
              href="https://www.seeedstudio.com/Grove-LoRa-Radio-433MHz-p-2777.html"
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASSES}
            >
              Seeed Studio - Grove LoRa Radio 433MHz
            </a>
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
