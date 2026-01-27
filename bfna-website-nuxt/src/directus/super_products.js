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
      i.superProductId = item.id;
      i.isSuperProduct = true;
      i.slug = common.slugify(item.heading);
      i.coverImage = item.cover_image ? common.getImage(item.cover_image.id) : null;
      i.image = {
        url: i.coverImage ? i.coverImage : null
      }
      i.report = item.report ? common.getImage(item.report.id) : null;
      i.videoUrl = item.video_url || null;
      i.websiteUrl = item.website_url || null;
      i.productSectionHeading = item.product_section_heading || null;
      i.productSectionDescription = item.product_section_description || null;
      i.buttonLabel = item.button_label || null;
      i.excerpt = item.excerpt || common.getExcerptFromContent(item.description);
      
      // Workstream data
      i.workstream = item.workstream ? {
        heading: item.workstream.heading,
        slug: common.slugify(item.workstream.heading),
        excerpt: item.workstream.excerpt,
        image: item.workstream.image ? common.getImage(item.workstream.image.id) : null,
      }: null;

      // Theme
      i.theme = i.workstream ? i.workstream.slug : 'default';

      i.button =  {
        url: `${i.workstream.slug}/${i.slug}`,
        label: item.button_label || 'Learn More'
      };

      // Related Products
      i.products = item.products ? item.products.map(prod => prod.products_id.id) : [];

      delete i.cover_image;
      delete i.website_url;
      delete i.video_url;
      delete i.product_section_heading;
      delete i.product_section_description;
      delete i.button_label;

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
