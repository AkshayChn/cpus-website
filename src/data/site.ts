export const site = {
  name: 'CPUS',
  fullName: 'Center for Public Understanding of Science',
  tagline: 'Science, in the language we live in.',
  description:
    'The Center for Public Understanding of Science (CPUS) is an Indian initiative working to make science part of everyday public life.',
  email: 'channeshts@gmail.com',
  directorEmail: 'director@cfpus.org',
  phones: ['+91 94482 68548', '+91 91106 00283'],
  address: {
    lines: [
      '#24, 4th Main',
      'Siddivinayaka Layout, Virupakshapura',
      'Bengaluru 560097',
      'Karnataka, India',
    ],
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles/' },
    { label: 'Series', href: '/series/' },
    { label: 'About', href: '/about/' },
    { label: 'Resources', href: '/resources/' },
    { label: 'Donate', href: '/donate/' },
  ],
  footer: [
    { label: 'Articles', href: '/articles/' },
    { label: 'Series', href: '/series/' },
    { label: 'About', href: '/about/' },
    { label: 'Resources', href: '/resources/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Donate', href: '/donate/' },
  ],
  social: {
    youtube: 'https://www.youtube.com/channel/UCyCr7sqonr-wmvOrEgMau3g',
    facebook: 'https://www.facebook.com/CPUSBengaluru/',
    instagram: 'https://www.instagram.com/cpus_bengaluru/',
    twitter: 'https://twitter.com/CPUS16',
  },
  donate: {
    // Source: the CPUS Donate page in the WordPress export.
    accountName: 'Centre for Public Understanding of Sceince',
    accountNumber: '843610110014043',
    ifsc: 'BKID0008436',
    bank: 'Bank of India',
    branch: 'Sahakara Nagar Branch',
    address: 'Bengaluru-560092, Karnataka(State), India',
  },
} as const;
