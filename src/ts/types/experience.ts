export interface Experience {
  id: string;
  company: string;
  location: string;
  role: string;
  period: string;
  stack: string[];
  highlights: string[];
  feature?: {
    label: string;
    href: string;
  };
}
