import dotenv from 'dotenv';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { createClient } from 'contentful'

import showdown from 'showdown';
import { JSDOM } from 'jsdom';

dotenv.config();

const CONTENT_STATUS = process.env.DEV ? JSON.parse(process.env.DEV) : ["published"]
const client = createDirectus(process.env.BASE_URL).with(rest());

// get content from directus
export const getDirectusData = async (collectionName, junctionFields=undefined) => {
  const content = await client.request(readItems(collectionName, {
    fields: junctionFields ? [`*.*`, ...junctionFields] : ['*.*'],
    limit: -1,
    filter: {
      "status": {
        "_in" : CONTENT_STATUS
      }
    }
  }));

  return { data: content };
}

// Contentful Client for Docs

export const contentfulClientDocs = createClient({
  space: process.env.DOCS_CONTENTFUL_SPACE,
  accessToken: process.env.DOCS_CONTENTFUL_ACCESS_TOKEN,
});

export const getThemeFromWorkspaceKey = (workspaceKey) => {
  switch (workspaceKey) {
    case "archives":
      return "default";
    case "digital-economy":
      return "digital-world";
    case "future-of-work":
      return "future-leadership";
    default:
      return workspaceKey;
  }
};

export const getImageAssetUrl = (url) => {
  if (url && !url.startsWith('https://')) {
    url = 'https:' + url.replace(/^https?:\/\//, '');
  }
  return `${url}?w=800&fm=webp&q=80&fit=fill`;
};

// -- Contentful Ends --





// getImageUrl
export const getImage = (imageId) => {
  return `${ process.env.BASE_URL }/assets/${ imageId }`;
}

// slugify
export const slugify = (term) => {
  return term
    .toString()
    .toLowerCase()
    .replace(/[àÀáÁâÂãäÄÅåª]+/g, "a") // Special Characters #1
    .replace(/[èÈéÉêÊëË]+/g, "e") // Special Characters #2
    .replace(/[ìÌíÍîÎïÏ]+/g, "i") // Special Characters #3
    .replace(/[òÒóÓôÔõÕöÖº]+/g, "o") // Special Characters #4
    .replace(/[ùÙúÚûÛüÜ]+/g, "u") // Special Characters #5
    .replace(/[ýÝÿŸ]+/g, "y") // Special Characters #6
    .replace(/[ñÑ]+/g, "n") // Special Characters #7
    .replace(/[çÇ]+/g, "c") // Special Characters #8
    .replace(/[ß]+/g, "ss") // Special Characters #9
    .replace(/[Ææ]+/g, "ae") // Special Characters #10
    .replace(/[Øøœ]+/g, "oe") // Special Characters #11
    .replace(/[%]+/g, "pct") // Special Characters #12
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

export const formatDate = (date) => {
  if (!date) return '';

  return new Date(date).toLocaleDateString(
    'en-gb',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
}

export const formatTime = (date) => {
  if (!date) return '';

  return new Date(date).toLocaleTimeString(
    'en',
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

// Get Authors`s names and create a formarted string names
const __getAuthorsFormated = (internal, external, collab, author) => {
  let ls_authors = [];

  // Externals Authors should be the first values in array
  if (external) {
    for (const person of external) {
      if (person && person.name) {
        ls_authors.push(person.name);

      }

    }
  }

  if (collab) {
    for (const person of collab) {
      if (person && person.name) {
        ls_authors.push(person.name);
      }
    }
  }

  if (internal) {
    for (const person of internal) {
      if (person && person.name) {
        // Internal authors should be the last values in array
        ls_authors.push(person.name);
      }
    }
  }

  if (author) {
    ls_authors.push(author);
  }

  if (ls_authors.length > 1) {
    let authors = "";
    for (let i = 0; i < ls_authors.length - 1; i++) {
      authors += ls_authors[i] + ", ";
    }

    // Ex.: Orquid, John and Juca
    return (
      authors.substring(0, authors.length - 2) +
      " and " +
      ls_authors[ls_authors.length - 1]
    );
  } else if (ls_authors.length == 1) {
    return ls_authors[0];
  } else {
    return "";
  }
};

export const getByLineForPublicationCard = (publish) => {
  let authors = __getAuthorsFormated(
    publish.internalAuthors,
    publish.externalAuthors,
    publish.externalCollaborators,
    publish.author
  );

  if (authors != "" && publish.publishDate != "") {
    return `By ${authors}, on ${formatDate(publish.publishDate)}`;
  } else if (authors != "" && publish.publishDate == "") {
    return `By ${authors}`;
  } else if (authors == "" && publish.publishDate != "") {
    return `On ${formatDate(publish.publishDate)}`;
  }
  return "";
};

// export const getExcerptFromContent = (content, charLength = 300) => {
//   if (!content) return '';

//   let excerpt = content.replace(/(<([^>]+)>)/gi, ""); // Remove HTML tags
//   if (excerpt.length > charLength) {
//     excerpt = excerpt.substring(0, charLength);
//     const lastSpace = excerpt.lastIndexOf(" ");
//     excerpt = excerpt.substring(0, lastSpace) + "...";
//   }
//   return excerpt;
// };


const getYTVideoID = (url) => {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  const id = match && match[7].length == 11 ? match[7] : false;

  return id;
};

export const videoURL = (url) => {
  if (!url) return null;
  const id = getYTVideoID(url);

  return `https://www.youtube.com/embed/${id}`;
};

export const getVideoThumbnail = async (videoUrl) => {
  const API_KEY = process.env.GOOGLE_KEY; // key generated by google suite account
  const videoId = videoUrl ? getYTVideoID(videoUrl) : [];
  let thumbsValue = '';

  //const API_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
  const API_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;

  const response = await fetch(API_URL).catch((err) =>
    console.log(`Error trying to get thumbnails for videos "${videoId}": ${err}`)
  );

  const json = await response.json();

  if (!json || !json.items || json.items.length === 0) {
    console.log(`No items found for videos "${videoId}"`);
    
  } else {
    for (let item of json.items) {
      const thumbs = item.snippet.thumbnails;
  
      if (thumbs.maxres) {
        thumbsValue = thumbs.maxres.url;
      } else if (thumbs.standard) {
        thumbsValue = thumbs.standard.url;
      } else if (thumbs.high) {
        thumbsValue = thumbs.high.url;
      } else if (thumbs.medium) {
        thumbsValue = thumbs.medium.url;
      } else if (thumbs.default) {
        thumbsValue = thumbs.default.url;
      } else {
        thumbsValue = "";
      }
    }

  }

  return thumbsValue;
};

export const getButtons = (fields) => {
  const getVideoButton = () => {
    if (fields.video_url) {

      return {
        type: "video",
        url: videoURL(fields.video_url),
        title: fields.title,
        label: fields.type == "video" ? "Open video" : "Watch Project Video",
      };
    }
    return null;
  };
  const getReportButton = () => {
    if (fields.report) {
      return {
        type: "report",
        url: `${fields.workstream.slug}/${fields.slug}`,
        label: "Read Report",
      };
    }
    return null;
  };


  const __getWebsiteLabel = (field) => {
    if(!fields.website_url) return 'Learn More'; // In case there's no website url, but is a product

    if (field.button_label && field.button_label.trim() !== '') {
      return field.button_label;
    } else if (field.type == "website") {
      return "Go to project website";
    } else {
      return "Open project website";
    }
  }

  const getWebsiteButton = () => {
    return {
      type: "website",
      url: fields.website_url ? fields.website_url : `${fields.workstream.slug}/${fields.slug}`,
      label: __getWebsiteLabel(fields),
    };
  };

  let btnResult = {};

  if (fields.type == "website") {
    btnResult = getWebsiteButton();
  } else if (fields.type == "report") {
    btnResult = getReportButton();
  } else if (fields.type == "video") {
    btnResult = getVideoButton();
  } else {
    return {
      url: `${fields.workstream.slug}/${fields.slug}`,
      label: "Learn More",
    };
  }

  return btnResult
};

export const convertToHTML = (md) => {
  const converter = new showdown.Converter();
  const html = converter.makeHtml(md);
  const dom = new JSDOM(html);

  const figure = (item) =>
    `<figure>${item.outerHTML}<figcaption>${item.getAttribute(
      "alt"
    )}</figcaption></figure>`;
  const imgs = dom.window.document.querySelectorAll("img");

  imgs.forEach((item, index) => {
    getVideoThumbnail;
    imgs[index].outerHTML = figure(item);
  });

  return dom.serialize();
};

export const getExcerptFromContent = (md) => {
  const converter = new showdown.Converter();
  const dom = new JSDOM(converter.makeHtml(md));

  return dom.window.document.querySelector("p").textContent;
};


const __getWorkspaceNameFromKey = (workspaceKey) => {
  switch (workspaceKey) {
    case "democracy":
      return "Democracy";
    case "future-of-work":
      return "Future Leadership";
    case "future-leadership":
      return "Future Leadership";
    case "digital-economy":
      return "Digital World";
    case "digital-world":
      return "Digital World";
    case "politics-society":
      return "Politics & Society";
    case "archives":
      return "Archived Projects";
    case "podcasts":
      return "Podcasts";
    default:
      return "";
  }
};

export const getBreadcrumbs = ({ workstream, title }) => {
  const breadcrumbs = { currentPage: title, items: [] };

  breadcrumbs.items.push({ link: "/", title: "Home" });
  breadcrumbs.items.push({
    link: `/${workstream}/`,
    title: __getWorkspaceNameFromKey(workstream),
  });

  return breadcrumbs;
};

const LANGUAGES = {
  "es-ES": "es",
  "en-US": "en",
  "fr-FR": "fr",
  "ar-SA": "ar",
  "zh-CN": "zh",
}