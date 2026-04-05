export interface Project {
  id: string;
  title: string;
  summary: string;
  stack: string[];
  role: string;
  status: 'completed' | 'in-progress' | 'archived';
  featured: boolean;
  links: {
    github: string | null;
    live: string | null;
  };
}
