import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';

const getSource = (url) => {
  if (!url) return null;
  if (url.includes("youtu")) {
    return 'youtube'
  } else if(url.includes("vimeo")){
    return 'vimeo'
  }
  return null;
}

// workstream may come through as a relation object or a plain key
const getWorkstreamKey = (workstream) => {
  if (!workstream) return 'default';
  if (typeof workstream === 'string') return workstream;
  return workstream.slug || common.slugify(workstream.heading || '') || 'default';
}

// background_image may come through as a file object (*.*) or a file id
const getBackgroundImage = (image) => {
  if (!image) return null;
  return common.getImage(typeof image === 'object' ? image.id : image);
}

const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'workstream.*',
      'background_image.*',
    ]

    const items = await common.getDirectusData("docs_documentaries", junctionFields);

    // keep the manual ordering set in Directus
    const docs = [...items.data].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    docs.forEach((item, index) => {
      const theme = common.getThemeFromWorkspaceKey(getWorkstreamKey(item.workstream));

      const i = {
        order: index,
        workstream: theme,
        theme: theme,
        heading: item.title,
        subheading: item.subtitle,
        by: item.by,
        button: {
          label: 'Watch',
          url: item.video_url,
        },
        description: item.description,
        backgroundImage: getBackgroundImage(item.background_image),
        tags: item.tags,
        transcript: item.transcript,
        screenings: item.screenings,
        videoInfo: item.video_info,
        awards: item.awards,
        source: getSource(item.video_url),
        objectType: 'docs',
        slug: item.slug || common.slugify(item.title),
      };

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
