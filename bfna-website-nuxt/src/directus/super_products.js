import fs from 'fs';
import { rimraf } from 'rimraf';
import * as common from './common.js';


const objectContructor = async (dir, fs) => {
  try {
    // use this list to add fields from junction tables
    const junctionFields = [
      'cover_image.*',
      'workstream.*',
      'report.*',
      'products.products_id.*',
    ]

    const items = await common.getDirectusData("super_products", junctionFields);

    await items.data.forEach((item) => {
      let i = item;
      i.slug = common.slugify(item.heading);
      i.coverImage = item.cover_image ? common.getImage(item.cover_image.id) : null;
      i.report = item.report ? common.getImage(item.report.id) : null;
      
      // Workstream data
      i.workstream = item.workstream ? {
        heading: item.workstream.heading,
        slug: common.slugify(item.workstream.heading),
        excerpt: item.workstream.excerpt,
        image: item.workstream.image ? common.getImage(item.workstream.image.id) : null,
      }: null;

      // Related Products
      i.products = item.products ? item.products.map(prod => {
        return {
          productId: prod.products_id.id
        }
      }) : [];

      delete i.cover_image;

      fs.writeFile(
        dir + "/" + i.slug + ".json",
        JSON.stringify(i),
        function (err, result) {
          if (err) console.log("error", err);
        }
      );
      console.log("WRITING SUPER PRODUCTS: ", i.slug + ".json");
    });
  } catch (error) {
    console.error('Error in objectContructor:', error);
  }
}

export const getSuperProducts = async () => {
  const dir = "./content/super_products";

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
    console.error('Error in getSuperProducts:', err);
  }
}
