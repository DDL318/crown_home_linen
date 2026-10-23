import { FrontDoor } from "@/components/store/front-door";
import { heroBanners } from "@/lib/catalog";
import { whatsappUrl } from "@/lib/format";
import { getStorefront } from "@/lib/repo";

// The home page is the front door: the crown, two lines about Crown, and the
// way into the shop. The headline comes from the first homepage banner and the
// second line from the first sentence of the footer note and the city, so
// both stay editable in the house book.
export default async function HomePage() {
  const { settings, ...snapshot } = await getStorefront();
  const banner = heroBanners({ settings, ...snapshot })[0];
  return (
    <FrontDoor
      headline={banner?.title || "Specialists in bedsheets and towels"}
      line={[settings.footerNote.split(/(?<=\.)\s/)[0]?.replace(/\.$/, "") || "Importers and wholesale dealers in textiles", settings.city.replace(/ /g, " ")].filter(Boolean).join(" · ")}
      whatsappHref={whatsappUrl(settings.whatsappNumber, settings.whatsappGreeting)}
      phone={settings.phoneDisplay}
    />
  );
}
