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

    const items = await common.getDirectusData("videos", junctionFields);

    await items.data.forEach(async (item) => {
      let i = item;
      i.slug = common.slugify(item.heading);

      // Video URL
      i.videoUrl = common.videoURL(item.video_url);

      // published date
      i.publishDate = item.publish_date;
      i.date = item.publish_date;
      
      // Workstream data
      i.workstream = item.workstream ? {
        heading: item.workstream.heading,
        slug: common.slugify(item.workstream.heading),
        excerpt: item.workstream.excerpt,
        image: item.workstream.image ? common.getImage(item.workstream.image) : null,
      }: null;

      i.button =  {
        url: `${ i.workstream.slug }/${ item.slug }`,
        label: item.button_label || 'Watch'
      };

      // Breadcrumbs
      i.breadcrumbs = common.getBreadcrumbs({ workstream: i.workstream.slug || 'default', title: i.heading });
      
      // Theme
      i.theme = i.workstream ? i.workstream.slug : 'default';

      // Thumbnail
      i.video = {
        thumbnail: await common.getVideoThumbnail(i.videoUrl),
      }
      
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
      delete i.internal_authors;

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

      delete i.external_collaborators;
      delete i.publish_date;
      delete i.video_url;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING VIDEOS: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getVideos = async () => {
  const dir = "./content/videos";

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
    console.error('Error in getVideos:', err);
  }
}
