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
    const { id = 4, name, level = "?", rankGlobal = "?", expCurrent, expNextLevel } = data;
    let fontpath = ["UTM Swiss 721 Black Condensed.ttf", "UTM NguyenHa 02.ttf"].map(e => path.resolve(__root, './font/', e))
    const buffer = await getAvatar(id);
    fs.writeFileSync(path.resolve(__root, `avt_${id}.png`), buffer);

    fs.writeFileSync(path.resolve(__root, "name_txt.png"), text2png(name, {
        color: '#4c4c4e',
        font: '30.71px UTM_NH',
        localFontPath: fontpath[1],
        localFontName: 'UTM_NH'
    }));
    fs.writeFileSync(path.resolve(__root, "score_txt.png"), text2png(`${expCurrent} / ${expNextLevel}`, {
        color: "#ffffff",
        font: "16.5px UTM_Swi",
        localFontPath: fontpath[0],
        localFontName: "UTM_Swi"
    }));
    fs.writeFileSync(path.resolve(__root, "level_txt.png"), text2png((level < 10) ? " " + level : level.toString(), {
        color: "#ffffff",
        font: "34.9px UTM_Swi",
        localFontPath: fontpath[0],
        localFontName: "UTM_Swi"
    }));
    fs.writeFileSync(path.resolve(__root, "global_rank_txt.png"), text2png("#????", {
        color: "#bfd4ed",
        font: "23.1px UTM_Swi",
        localFontPath: fontpath[0],
        localFontName: "UTM_Swi"
    }));
    fs.writeFileSync(path.resolve(__root, "global_rank_bg.png"), text2png("Global: ", {
        color: "#96f1ea",
        font: "23.1px UTM_Swi",
        localFontPath: fontpath[0],
        localFontName: "UTM_Swi"
    }));
    let imgpath = [
        "background.png",
        "gradient_bg.png",
        "level_bg.png",
        "progress_bar_bg.png",
        "progress_bar.png",
        "card_bg.png",
        `avt_${id}.png`,
        "name_txt.png",
        "level_txt.png",
        "score_txt.png",
        "global_rank_bg.png",
        "global_rank_txt.png",
    ].map(e => path.resolve(__root, e))
    let readJimp = [];
    imgpath.forEach(i => {
        readJimp.push(jimp.read(i));
    });
  // todo: global ranking//
    const [background, gradient_bg, level_bg, progress_bar_bg, progress_bar, card_bg, avt, name_txt, level_txt, score_txt, global_ranking, gl_rank] = await Promise.all(readJimp);
    background
        .composite(gradient_bg, 0, 0)
        .composite(progress_bar_bg, 0, 0)
        .composite(progress_bar, -(381 - 381 * expCurrent / expNextLevel), 0)
        .composite(gradient_bg, -600, 0)
        .composite(level_bg, 0, 0)
        .composite(card_bg, 0, 0)
        .composite(avt.resize(140, jimp.AUTO), 45, 18)
        .composite(name_txt, 214, 12)
        .composite(level_txt, 215, 73)
        .composite(score_txt, 413, 52)

    const pathImg = path.resolve(__root, `../temp/${id}.png`);

    return await new Promise(function (resolve) {
        background.write(pathImg, () => {
            resolve(pathImg)
        });
    })

}

