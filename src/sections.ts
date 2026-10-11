import type { EntryLabels } from './components/EntryList';
import type { SectionKind } from './model';

export const SECTION_LABELS: Record<SectionKind, { name: string; labels: EntryLabels }> = {
  projects: {
    name: 'Projects',
    labels: {
      item: 'Project',
      title: 'Project name',
      organization: 'Role, context or tools',
      location: 'Link (optional)',
      dates: true,
      current: 'Ongoing',
      details: 'What you did',
      detailsHint: 'One bullet per line. Say what you built and what changed because of it.',
      add: '+ Add project',
    },
  },
  languages: {
    name: 'Languages',
    labels: {
      item: 'Language',
      title: 'Language',
      organization: 'Proficiency (e.g. Native, Fluent, Conversational)',
      add: '+ Add language',
    },
  },
  awards: {
    name: 'Awards',
    labels: {
      item: 'Award',
      title: 'Award or honor',
      organization: 'Awarded by',
      singleDate: 'Date',
      details: 'Details (optional)',
      add: '+ Add award',
    },
  },
  volunteer: {
    name: 'Volunteer',
    labels: {
      item: 'Role',
      title: 'Role',
      organization: 'Organization',
      location: 'Location',
      dates: true,
      current: 'I currently volunteer here',
      details: 'What you did',
      detailsHint: 'One bullet per line.',
      add: '+ Add volunteer role',
    },
  },
  custom: {
    name: 'Custom section',
    labels: {
      item: 'Item',
      title: 'Title',
      organization: 'Organization or subtitle',
      location: 'Location',
      dates: true,
      current: 'Ongoing',
      details: 'Details',
      detailsHint: 'One bullet per line.',
      add: '+ Add item',
    },
  },
};
