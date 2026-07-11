// Sitewide footer: the external links §2 requires everywhere on the site,
// not just the homepage - MDA's defibrillator map, and 3 real LoRa 433MHz
// purchase sites. All open in a new tab (they're leaving the site).
//
// All 3 purchase links below were confirmed live, in stock, and genuinely
// 433MHz by direct fetch (not just a search-result snippet) on 2026-07-12 -
// the original Amazon link went dead stock ("Currently unavailable")
// shortly after Phase 9 shipped, which is exactly the risk of trusting a
// single retailer's listing to stay valid. See brief §11 for the full story.
const EXTERNAL_LINK_CLASSES = "text-signal hover:underline";

export function Footer() {
  return (
    // WHY bg-line/20: a tinted overlay of the existing `line` token (already
    // used for borders) rather than a new color - just enough to read as a
    // distinct footer region against the page's paper background, without
    // adding a whole new token for one small tweak.
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
            {/* WHY this label, not "המפה של מד״א": the map isn't hosted on
                mda.org.il itself - it's the community-mapping site MDA's own
                101 dispatch center actually uses on-screen (see brief §11,
                2026-07-11). Accurate labeling matters more than a shorter
                sentence. */}
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
      </div>
    </footer>
  );
}
