import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';

// TODO: UPDATE THIS FILE TO GET BFNA DOCS DATA FROM DIRECTUS WHEN THE MIGRATION IS COMPLETE.

const getSource = (url) => {
  if (url.includes("youtu")) {
    return 'youtube'
  } else if(url.includes("vimeo")){
    return 'vimeo'
  }
}

const getManagedDocs = async () => {
  const response = await common.contentfulClientDocs.getEntries({
    content_type: 'bfnaDocsDisplayManagement',
    include: 1,
    limit: 4,
  })
  return response
}

const getDocumentaries = async () => {
  const docs =[]
  const data = await getManagedDocs()
  data.items.map(( { fields }, index) => {
    
    let featured = fields.featured
    let featuredItem = {
      order: index,
      workstream: common.getThemeFromWorkspaceKey(featured.fields.workstream),
      theme: common.getThemeFromWorkspaceKey(featured.fields.workstream),
      heading: featured.fields.title,
      subheading: featured.fields.subtitle,
      by: featured.fields.by,
      button: {
        label: 'Watch',
        url: featured.fields.video_url,
      },
      description: featured.fields.description,
      backgroundImage: common.getImageAssetUrl(featured.fields.background_image.fields.file.url),
      tags: featured.fields.tags,
      transcript: featured.fields.transcript,
      screenings: featured.fields.screenings,
      videoInfo: featured.fields.video_info,
      awards: featured.fields.awards,
      source: getSource(featured.fields.video_url),
      objectType: 'docs'
    }
    docs.push(featuredItem)

    fields.featuredOrder.map((item, index) => {
      let fields = item.fields
      let featuredOrderItem = {
        order: index+1,
        workstream: common.getThemeFromWorkspaceKey(fields.workstream),
        theme: common.getThemeFromWorkspaceKey(fields.workstream),
        heading: fields.title,
        subheading: fields.subtitle,
        by: fields.by,
        button: {
          label: 'Watch',
          url: fields.video_url,
        },
        description: fields.description,
        backgroundImage: common.getImageAssetUrl(fields.background_image.fields.file.url),
        tags: fields.tags,
        transcript: fields.transcript,
        screenings: fields.screenings,
        videoInfo: fields.video_info,
        awards: fields.awards,
        source: getSource(fields.video_url),
        objectType: 'docs'
      }
      docs.push(featuredOrderItem)
    })
  })
  
  return docs
}

const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'image.*',
    ]

    const items = await getDocumentaries();

    await items.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      // i.image = item.image ? common.getImage(item.image.id) : null;
      // i.buttonLabel = item.button_label || "Read More";
      
      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING DOC: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getDocs = async () => {
  const dir = "./content/docs";

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
    console.error('Error in getDocs:', err);
  }
}