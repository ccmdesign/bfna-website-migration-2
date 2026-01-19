import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'workstream.*',
    ]

    const items = await common.getDirectusData("workstreams", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      i.combinedSlug = `workstream-${common.slugify(item.heading)}`;
      i.excerpt = item.excerpt;
      i.image = item.image ? common.getImage(item.image.id) : null;
      i.button =  {
        url: item.slug,
        label: item.button_label || 'Learn More'
      };

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING WORKSTREAMS: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getWorkstreams = async () => {
  const dir = "./content/workstreams";

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
    console.error('Error in getWorkstreams:', err);
  }
}
