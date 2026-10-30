interface BrandColors {
  primary: string;
  secondary: string;
  primaryHover: string;
  gradient: string;
  light: string;
  lightBg: string;
}

const COLORS: BrandColors = {
  primary: "#E63946",
  secondary: "#0A0A0B",
  primaryHover: "#C82F3B",
  gradient: "linear-gradient(135deg, #E63946, #C82F3B)",
  light: "#FF6B7A",
  lightBg: "rgba(230, 57, 70, 0.06)",
};

const BRAND = {
  name: "PDF Editor Online",
  domain: "pdfeditoronline.net",
  logoParts: ["pdfeditor", "online"] as [string, string],
  brandKey: "PDFEditorOnline",
  colors: COLORS,
};

// Old env values still resolve to this brand, so a leftover
// VITE_BRAND_NAME / BRAND_NAME does not bring the previous identity back.
const brand = BRAND;

export const brandName = brand.name;
export const brandDomain = brand.domain;
export const supportEmail = `support@${brand.domain}`;
export const logoWord = brand.logoParts[0];
export const logoAccent = brand.logoParts[1];
export const logoParts = brand.logoParts;
export const brandKey = brand.brandKey;
export const colors = brand.colors;
export const isFastDoc = false;

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-brand", brand.brandKey);
}
