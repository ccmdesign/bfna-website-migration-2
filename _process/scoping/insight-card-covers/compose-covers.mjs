import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const directory=path.dirname(fileURLToPath(import.meta.url))
const repository=path.resolve(directory,'../../..')
const require=createRequire(path.join(repository,'bfna-website-nuxt/package.json'))
const sharp=require('sharp')
const [sourceDirectory,outputDirectory]=process.argv.slice(2)
if(!sourceDirectory||!outputDirectory)throw Error('Usage: node compose-covers.mjs <source-directory> <output-directory>')
const {plans}=JSON.parse(fs.readFileSync(path.join(directory,'composition-plan.json'),'utf8'))
fs.mkdirSync(outputDirectory,{recursive:true})
for(const plan of plans){
 const source=fs.readFileSync(path.join(sourceDirectory,plan.source_file))
 if(createHash('sha256').update(source).digest('hex')!==plan.source_sha256)throw Error('Source hash mismatch: '+plan.slug)
 const meta=await sharp(source).metadata()
 let coveredHeight=0
 const layers=[]
 for(const piece of plan.pieces){
  if(piece.source.left!==0||piece.source.top!==coveredHeight||piece.source.width!==meta.width)throw Error('Source piece gap or crop: '+plan.slug)
  coveredHeight+=piece.source.height
  if(piece.destination.left<0||piece.destination.left+piece.destination.width>1200||piece.destination.top<0||piece.destination.top+piece.destination.height>1060)throw Error('Title-safe area violation: '+plan.slug)
  const resized=await sharp(source).extract(piece.source).resize(piece.destination.width,piece.destination.height,{fit:'fill',kernel:'lanczos3'}).png().toBuffer()
  layers.push({input:resized,left:piece.destination.left,top:piece.destination.top})
 }
 if(coveredHeight!==meta.height)throw Error('Source height lost: '+plan.slug)
 const canvas=sharp({create:{...plan.canvas,channels:4}})
 const output=await canvas.composite(layers).png({compressionLevel:9}).toBuffer()
 const destination=path.join(outputDirectory,plan.slug+'.png')
 if(fs.existsSync(destination)&&!fs.readFileSync(destination).equals(output))throw Error('Refusing to overwrite a different derivative: '+destination)
 fs.writeFileSync(destination,output)
}
console.log('Composed '+plans.length+' exact 1200×1500 covers; every source pixel region retained above y=1060.')
