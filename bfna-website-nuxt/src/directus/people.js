import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
    ]

    const items = await common.getDirectusData("people", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.personId = item.id;
      i.slug = common.slugify(item.name);
      i.name = item.name;
      i.JobTitle = item.job_title;
      i.image = item.image ? common.getImage(item.image.id) : null;
      i.email = item.email;
      i.bio = item.bio;
      i.linkedin = item.linkedin;
      i.twitter = item.twitter;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING PEOPLE: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getPeople = async () => {
  const dir = "./content/people";

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
    console.error('Error in getPeople:', err);
  }
}
