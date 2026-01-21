import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'workstream.*',
      'team.people_id.*',
      'board_of_directors.people_id.*',
      'products.product_id.*',
      'super_products.super_product_id.*',
    ]

    const items = await common.getDirectusData("workstreams", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      i.theme = i.slug || 'default';
      i.combinedSlug = `workstream-${common.slugify(item.heading)}`;
      i.excerpt = item.excerpt;
      i.image = item.image ? common.getImage(item.image.id) : null;
      i.button =  {
        url: item.slug,
        label: item.button_label || 'Learn More'
      };

      // team members
      if (item.team && item.team.length > 0) {
        i.team = item.team.map((member) => {
          return {
            id: member.people_id.id,
          };
        });
      } else {
        i.team = [];
      }

      // board of directors members
      if (item.board_of_directors && item.board_of_directors.length > 0) {
        i.boardOfDirectors = item.board_of_directors.map((member) => {
          return {
            id: member.people_id.id,
          };
        });
      } else {
        i.boardOfDirectors = [];
      }

      // products
      if (item.products && item.products.length > 0) {
        i.products = item.products.map((p) =>p.products_id);
      } else {
        i.products = [];
      }

      // super products
      if (item.super_products && item.super_products.length > 0) {
        i.superProducts = item.super_products.map((sp) =>sp.super_products_id);
      } else {
        i.superProducts = [];
      }

      delete i.board_of_directors;
      delete i.super_products;

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
