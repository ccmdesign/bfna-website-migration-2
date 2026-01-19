import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
    ]

    const items = await common.getDirectusData("external_collaborators", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.name);
      i.name = item.name;
      i.JobTitle = item.job_title;
      i.image = item.image ? common.getImage(item.image.id) : null;
      i.email = item.email;
      i.bio = item.bio;
      i.linkedin = item.linkedin;
      i.twitter = item.twitter;
      i.type = item.type;
      i.cepiYear = item.cepi_year;
      i.role = item.role;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING EXTERNAL COLLABORATORS: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getExternalCollaborators = async () => {
  const dir = "./content/external_collaborators";

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
    console.error('Error in getExternalCollaborators:', err);
  }
}
