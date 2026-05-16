"use client";

// Impressum (§ 5 DDG / § 18 MStV). Orda is a single-restaurant white-label
// deployment — the legally responsible party is the restaurant operator.
// The restaurant name comes from `configuration` (real data); every field
// that carries legal liability is a clearly-marked placeholder the operator
// MUST complete (with their lawyer / IHK). See Husseinahk/orda#155.
// We deliberately do NOT infer the legal address from the delivery address.
import { useConfig } from "@/lib/context/configuration/configuration.context";

const TODO = "[ bitte ergänzen ]";

export default function ImpressumPage() {
  const { RESTAURANT_NAME } = useConfig();
  const brand = RESTAURANT_NAME || TODO;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <p className="leading-relaxed">
      <span className="font-medium">{label}: </span>
      <span>{value}</span>
    </p>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Impressum</h1>

      <section className="space-y-1 mb-8">
        <h2 className="text-lg font-semibold mb-2">
          Angaben gemäß § 5 DDG
        </h2>
        <Row label="Anbieter" value={brand} />
        <Row label="Rechtsform" value={TODO} />
        <Row label="Anschrift" value={`${TODO} (ladungsfähige Anschrift)`} />
        <Row label="Vertreten durch" value={TODO} />
      </section>

      <section className="space-y-1 mb-8">
        <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
        <Row label="Telefon" value={TODO} />
        <Row label="E-Mail" value={TODO} />
      </section>

      <section className="space-y-1 mb-8">
        <h2 className="text-lg font-semibold mb-2">Umsatzsteuer</h2>
        <Row
          label="USt-IdNr. (§ 27a UStG)"
          value={TODO}
        />
      </section>

      <section className="space-y-1 mb-8">
        <h2 className="text-lg font-semibold mb-2">Registereintrag</h2>
        <Row label="Registergericht" value={TODO} />
        <Row label="Registernummer" value={TODO} />
      </section>

      <section className="space-y-1 mb-8">
        <h2 className="text-lg font-semibold mb-2">
          Verantwortlich i. S. d. § 18 Abs. 2 MStV
        </h2>
        <Row label="Name / Anschrift" value={TODO} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold mb-2">
          Verbraucherstreitbeilegung
        </h2>
        <p className="leading-relaxed">
          Plattform der EU-Kommission zur Online-Streitbeilegung:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p className="leading-relaxed">{TODO} (Hinweis zur Teilnahme an
          einem Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle)</p>
      </section>

      <p className="mt-10 text-xs text-gray-500">
        Hinweis für den Betreiber: Alle mit „{TODO}“ markierten Angaben sind
        vor dem Live-Gang rechtsverbindlich zu vervollständigen
        (siehe Projekt-Issue #155). Dies ist keine Rechtsberatung.
      </p>
    </main>
  );
}
