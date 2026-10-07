// TEST ONLY — branch triage-content-test, never merge.
// End-to-end test of the build-triage routine's tier-2 content section
// (ccm-ops agents/_specs/spec-triage-directus-content.md, step B). Reads the
// throwaway Directus collection zz_triage_test, whose item #2 has no slug, and
// deliberately has no try/catch so that item fails the import and the build.
import fs from 'fs';
import * as common from './common.js';

export const getTriageTest = async () => {
  const dir = './content/zz-triage-test';
  if (!fs.existsSync('./content')) fs.mkdirSync('./content');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const { data } = await common.getDirectusData('zz_triage_test');
  for (const item of data) {
    const file = item.slug.toLowerCase() + '.json';
    fs.writeFileSync(`${dir}/${file}`, JSON.stringify(item));
    console.log('WRITING TRIAGE TEST: ', file);
  }
};
