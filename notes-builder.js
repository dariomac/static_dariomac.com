const { readVault } = require('obsidian-vault-parser');
const fs = require('fs');
const path = require('path');
const urlSlug = require('url-slug');

(async () => {
  
  const vault = await readVault('../bra1n', 
  {
    isPublished: (file) => {
      let getIt = false;
      getIt = file.frontMatter != null && file.frontMatter.tags;
      if (getIt && Array.isArray(file.frontMatter.tags)) {
        getIt = file.frontMatter.tags.includes('dm.com');
      } else {
        getIt = false;
      }
      return getIt;
    }
  }
  );

  console.log(JSON.stringify(vault.files, null, 4));

  Object.keys(vault.files).forEach((noteKey) => {
    const note = vault.files[noteKey];

    let dmdNote = JSON.stringify(note.frontMatter.json, null, 4);
    dmdNote += '\n\n---\n\n';

    dmdNote += '[summary:string]\n';
    dmdNote += `${note.frontMatter.json.card.content}\n\n`;

    dmdNote += '[pub_date:string]\n';
    dmdNote += `${note.frontMatter.json.date}\n\n`;

    dmdNote += '[short_description:string]\n\n';

    dmdNote += '[body:md]\n';
    dmdNote += `${note.content.trim()}\n\n`;

    dmdNote += '[acknowledgments:md]\n\n';

    dmdNote += '[further_reading:md]\n\n';

    dmdNote += '[significant_revisions:md]\n\n';
    dmdNote += `_${new Date(`${note.frontMatter.json.date} GMT-0300`).toLocaleString('en-US', {
      month: 'short', // numeric, 2-digit, long, short, narrow
      day: 'numeric', // numeric, 2-digit
      year: 'numeric', // numeric, 2-digit
    })}_: Original publication on dariomac.com\n`;
    
    fs.writeFileSync(path.resolve(`./data/document/${urlSlug(note.name)}.dmd`), dmdNote, 'utf8');
  });

})().catch(e => {
  console.log(e);
});
