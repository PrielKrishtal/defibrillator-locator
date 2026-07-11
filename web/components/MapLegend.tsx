// Explains what the map's markers mean. Plain HTML/CSS, not a Leaflet
// control - it's regular page content, not something that needs to pan/zoom
// with the map, so a Leaflet control would be more machinery for no benefit.
export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-line bg-paper px-4 py-3 text-sm">
      <LegendItem>
        <span className="inline-block h-3 w-3 rounded-full bg-flare" />
        נקודת מצוקה
      </LegendItem>
      <LegendItem>
        <span className="inline-block h-3 w-3 rounded-full bg-signal" />
        מכשיר בטווח
      </LegendItem>
      <LegendItem>
        <span className="relative inline-block h-3 w-3">
          <span className="absolute inset-0 -m-1 rounded-full border border-beacon" />
          <span className="absolute inset-0 rounded-full bg-signal" />
        </span>
        מכשיר עם LoRa
      </LegendItem>
      <LegendItem>
        <span className="inline-block h-3 w-3 rounded-full bg-line" />
        מחוץ לטווח
      </LegendItem>
      <LegendItem>
        <span className="inline-block h-1 w-4 rounded-full bg-beacon" />
        מסלול רכיבה
      </LegendItem>
    </div>
  );
}

function LegendItem({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
