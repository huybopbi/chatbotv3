const jimp = require("jimp");
const text2png = require('text2png');
const fs = require("fs");
const request = require('request-promise');
const path = require('path');
function getAvatar(id) {
    return request({
        url: `https://graph.facebook.com/${id}/picture?width=512`,
        encoding: null
    })
}
const __root = path.resolve(__dirname, '../material');
module.exports = async function (data) {
    const { id = 4, name, level = "?", expCurrent, expNextLevel } = data;
    let fontpath = ["AvantGarde_Demi.ttf", "AvantGarde.ttf"].map(e => path.resolve(__root, './font/', e))
    const buffer = await getAvatar(id);
    fs.writeFileSync(path.resolve(__root, `avt_${id}.png`), buffer);

    fs.writeFileSync(path.resolve(__root, "name_txt.png"), text2png(name, {
        color: '#ffffff',
        font: '36.749834px AvantGarde-Demi',
        localFontPath: fontpath[0],
        localFontName: 'AvantGarde-Demi'
    }));
    fs.writeFileSync(path.resolve(__root, "score_txt.png"), text2png(`${expCurrent} / ${expNextLevel}`, {
        color: "#85d7ea",
        font: "26.748885px AvantGarde",
        localFontPath: fontpath[1],
        localFontName: "AvantGarde"
    }));
    fs.writeFileSync(path.resolve(__root, "level_txt.png"), text2png((level < 10) ? " " + level : level.toString(), {
        color: "#ffffff",
        font: "44.984347px AvantGarde-Demi",
        localFontPath: fontpath[0],
        localFontName: "AvantGarde-Demi"
    }));
    let imgpath = [
        "bg.png",
        `avt_${id}.png`,
        "name_txt.png",
        "level_txt.png",
        "score_txt.png",
    ].map(e => path.resolve(__root, e))
    let readJimp = [];
    imgpath.forEach(i => {
        readJimp.push(jimp.read(i));
    });
  // todo: global ranking//
    const [bg, level_bg, avt, name_txt, level_txt, score_txt] = await Promise.all(readJimp);
    background
        .composite(bg, 0, 0)
        .composite(avt.resize(310.689792, jimp.AUTO), 137.50, 105.50)
        .composite(name_txt, 364.50, 126.50)
        .composite(level_txt, 299.96, 71)
        .composite(score_txt, 390.77, 156.72)

    const pathImg = path.resolve(__root, `../temp/${id}.png`);

    return await new Promise(function (resolve) {
        background.write(pathImg, () => {
            resolve(pathImg)
        });
    })

}

