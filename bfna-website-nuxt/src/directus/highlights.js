import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'image.*',
    ]

    const items = await common.getDirectusData("highlights", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      i.image = item.image ? common.getImage(item.image.id) : null;
      i.buttonLabel = item.button_label || "Read More";
      
      delete i.button_label;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING HIGHLIGHT: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getHighlights = async () => {
  const dir = "./content/highlights";

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
    console.error('Error in getHighlights:', err);
  }
}
