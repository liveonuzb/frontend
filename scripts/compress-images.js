// import sharp from "sharp";
// import fs from "fs";
// import path from "path";
//
// const inputDir = "../public";
// const outputDir = "../public/optimized";
//
// fs.mkdirSync(outputDir, { recursive: true });
//
// for (const file of fs.readdirSync(inputDir)) {
//   if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
//
//   await sharp(path.join(inputDir, file))
//     .resize({ width: 1200, withoutEnlargement: true })
//     .webp({ quality: 75 })
//     .toFile(path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, ".webp")));
// }

//
// import fs from "fs";
// import path from "path";
//
// function walk(dir) {
//   let files = [];
//
//   for (const file of fs.readdirSync(dir)) {
//     const full = path.join(dir, file);
//     const stat = fs.statSync(full);
//
//     if (stat.isDirectory()) {
//       files = files.concat(walk(full));
//     } else if (/\.(js|jsx|ts|tsx)$/i.test(file)) {
//       files.push(full);
//     }
//   }
//
//   return files;
// }
//
// const files = walk("../src");
//
// for (const file of files) {
//   let content = fs.readFileSync(file, "utf8");
//
//   content = content.replace(
//     /\/onboarding\/([^"'\s]+)\.(png|jpg|jpeg)/gi,
//     "/optimized/onboarding/$1.webp",
//   );
//
//   fs.writeFileSync(file, content);
//   console.log("Updated:", file);
// }
//
// console.log("Done.");

//
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const root = path.resolve(__dirname, "..");
//
// function walk(dir) {
//   let files = [];
//
//   for (const file of fs.readdirSync(dir)) {
//     const full = path.join(dir, file);
//     const stat = fs.statSync(full);
//
//     if (stat.isDirectory()) {
//       files = files.concat(walk(full));
//     } else if (/\.(js|jsx|ts|tsx)$/i.test(file)) {
//       files.push(full);
//     }
//   }
//
//   return files;
// }
//
// const files = walk(path.join(root, "./src"));
//
// for (const file of files) {
//   let content = fs.readFileSync(file, "utf8");
//
//   // loading yo‘q img larga qo‘shadi
//   content = content.replace(
//     /<img(?![^>]*loading=)([^>]*?)>/g,
//     '<img loading="lazy"$1>',
//   );
//
//   fs.writeFileSync(file, content);
//   console.log("Updated:", file);
// }
//
// console.log("Done.");
