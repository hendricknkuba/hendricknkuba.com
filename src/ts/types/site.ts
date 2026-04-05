export interface Social {
  label: string;
  href: string;
  icon: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  url: string;
  socials: Social[];
  nav: NavItem[];
}

export interface Skills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  concepts: string[];
}
