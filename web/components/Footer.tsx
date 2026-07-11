// Sitewide footer: the external links §2 requires everywhere on the site,
// not just the homepage - MDA's defibrillator map, and 3 real LoRa 433MHz
// purchase sites. All open in a new tab (they're leaving the site).
const EXTERNAL_LINK_CLASSES = "text-signal hover:underline";

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-8 text-sm sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
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
              href="https://www.amazon.com/ACROBOTIC-Arduino-ESP8266-Raspberry-LoRAWAN/dp/B07MNJ4YTC"
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASSES}
            >
              Amazon - ACROBOTIC Ra-02 SX1278 433MHz
            </a>
            <a
              href="https://www.ebay.com/itm/363842862770"
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASSES}
            >
              eBay - SX1278 LoRa 433MHz RA-01
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
