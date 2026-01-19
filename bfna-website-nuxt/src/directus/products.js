import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'internal_authors.people_id.*',
      'external_collaborators.external_collaborators_id.*',
      'workstream.*',
    ]

    const items = await common.getDirectusData("products", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      // published date
      i.publishDate = item.publish_date;
      i.date = item.publish_date;
      i.coverImage = item.cover_image ? common.getImage(item.cover_image.id) : null;
      i.image = {
        url: item.cover_image ? common.getImage(item.cover_image.id) : null,
      };
      i.infographic = item.infographic ? common.getImage(item.infographic.id) : null;
      i.button =  {
        url: item.slug,
        label: item.button_label || 'Learn More'
      };
      i.buttonLabel = item.button_label || 'Learn More';
      i.videoUrl = item.video_url;
      i.websiteUrl = item.website_url;

      // Additional fields to remove
      i.personSectionHeading = item.person_section_heading;
      i.personSectionDescription = item.person_section_description;
      i.embedCode = item.embed_code;
      
      // Original Publication Info
      i.originalPublicationName = item.original_publication_name;
      i.originalPublicationUrl = item.original_publication_url;
      i.originalPublicationDate = item.original_publication_date;
      i.originalPublication = item.original_publication;
      
      // Workstream data
      i.workstream = item.workstream ? {
        heading: item.workstream.heading,
        slug: common.slugify(item.workstream.heading),
        excerpt: item.workstream.excerpt,
        image: item.workstream.image ? common.getImage(item.workstream.image) : null,
      }: null;
      
      // Theme
      i.theme = i.workstream ? i.workstream.slug : 'default';

      i.isProduct = true;
      i.isPodcast = i.workstream && i.workstream.slug === 'podcasts' ? true : false;
 
      // Internal Authors
      i.internalAuthors = item.internal_authors ? item.internal_authors.map(item => {
        const author = item.people_id;
        return {
          name: author.name,
          jobTitle: author.job_title,
          image: author.image ? common.getImage(author.image) : null,
          email: author.email,
          bio: author.bio,
          linkedin: author.linkedin,
          twitter: author.twitter,
        }
      }) : [];

      // External Collaborators
      i.externalCollaborators = item.external_collaborators ? item.external_collaborators.map(item => {
        const collab = item.external_collaborators_id;
        return {
          name: collab.name,
          jobTitle: collab.job_title,
          image: collab.image ? common.getImage(collab.image) : null,
          email: collab.email,
          bio: collab.bio,
          linkedin: collab.linkedin,
          twitter: collab.twitter,
          type: collab.type,
          cepiYear: collab.cepi_year,
          role: collab.role,
        }
      }) : [];

      // By Line
      i.byLine = common.getByLineForPublicationCard(i);

      delete i.internal_authors;
      delete i.external_collaborators;
      delete i.download_media;
      delete i.external_authors;
      delete i.original_publication_name;
      delete i.original_publication_url;
      delete i.original_publication_date;
      delete i.original_publication;
      delete i.publish_date;
      delete i.cover_image;
      delete i.video_url;
      delete i.website_url;
      delete i.person_section_heading;
      delete i.person_section_description;
      delete i.embed_code;
      delete i.button_label;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING PRODUCTS: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getProducts = async () => {
  const dir = "./content/products";

  try {
    if (fs.existsSync(dir)) {
      await rimraf(dir);
    }

    if (!fs.existsSync("./content")) {
      fs.mkdirSync("./content");
    }
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    await objectContructor(dir, fs);
  } catch (err) {
    console.error('Error in getProducts:', err);
  }
}
