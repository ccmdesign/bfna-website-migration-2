import { getHighlights } from './src/directus/highlights.js';
import { getSuperProducts } from './src/directus/super_products.js';
import { getWorkstreams } from './src/directus/workstreams.js';
import { getVideos } from './src/directus/videos.js';
import { getPeople } from './src/directus/people.js';
import { getExternalCollaborators } from './src/directus/external_collaborators.js';
import { getPublications } from './src/directus/publications.js';
import { getInfographics } from './src/directus/infographics.js';
import { getProducts } from './src/directus/products.js';
import { getAnnouncements } from './src/directus/announcements.js';
import { getDocs } from './src/directus/docs.js';


console.log('');
console.log('Starting importing data from Directus...');
console.log('');
console.log('[ BFNA: HIGHLIGHTS - SUPER PRODUCTS WORKSTREAMS VIDEOS PEOPLE EXTERNAL COLLABORATORS PUBLICATIONS INFOGRAPHICS PRODUCTS ANNOUNCEMENTS DOCS ]');

getHighlights();
getSuperProducts();
getWorkstreams();
getVideos();
getPeople();
getExternalCollaborators();
getInfographics();
getPublications();
getProducts();
getAnnouncements();
getDocs();