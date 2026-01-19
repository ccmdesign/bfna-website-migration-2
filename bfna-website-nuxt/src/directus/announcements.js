import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
    ]

    const { data } = await common.getDirectusData("announcements", junctionFields);

    let i = data;
    i.slug = common.slugify(data.heading);

    // Workstream data
    i.workstream = data.workstream ? {
      heading: data.workstream.heading,
      slug: common.slugify(data.workstream.heading),
      excerpt: data.workstream.excerpt,
      image: data.workstream.image ? common.getImage(data.workstream.image) : null,
    }: null;

    fs.writeFile(
      dir + "/" + i.slug + ".json",
      JSON.stringify(i),
      function (err, result) {
        if (err) console.log("error", err);
      }
    );
    console.log("WRITING ANNOUNCEMENT: ", i.slug + ".json");

  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getAnnouncements = async () => {
  const dir = "./content/announcements";

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
    console.error('Error in getAnnouncements:', err);
  }
}
