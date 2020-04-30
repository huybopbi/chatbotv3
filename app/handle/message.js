const fs = require("fs");
const createCard = require("../controllers/rank_card");
const osu = require("node-osu");
const ytdl = require("ytdl-core");
const moment = require("moment-timezone");
const request = require("request");
const http = require("http");
const randomfacts = require("@dpmcmlxxvi/randomfacts");
const api = "https://random-word-api.herokuapp.com/word?number=1";
const wiki = require("wikijs").default;
const facebook = require("facebook-video-downloader");
const cmd = require("node-cmd");
const osutils = require("os-utils");
const ms = require("parse-ms");
var timer = moment.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm:ss.sss[Z]");
//MODULES//
const playvideo = require("./modules/playvideo");
const music = require("./modules/music");
const tts = require("./modules/say");

module.exports = function({
  api,
  modules,
  config,
  __GLOBAL,
  User,
  Thread,
  Rank,
  economy
}) {
  let {
    prefix,
    googleSearch,
    wolfarm,
    osuAPI,
    yandex,
    openweather,
    tenor,
    admins,
    steamAPI,
    ENDPOINT
  } = config;
  /* ================ CronJob ==================== */

  if (!fs.existsSync(__dirname + "/src/listCommands.json")) {
    var template = [];
    push = JSON.stringify(template);
    fs.writeFile(__dirname + "/src/listCommand.json", push, "utf-8", err => {
      if (err) throw err;
      modules.log("Tạo file listCommand mới thành công!");
    });
  }
  
  if (!fs.existsSync(__dirname + "/src/groupID.json")) {
    var template = [];
    push = JSON.stringify(template);
    fs.writeFile(__dirname + "/src/listCommand.json", push, "utf-8", err => {
      if (err) throw err;
      modules.log("Tạo file groupID mới thành công!");
    });
  }

  if (!fs.existsSync(__dirname + "/src/quotes.json")) {
    request("https://type.fit/api/quotes", (err, response, body) => {
      if (err) throw err;
      var bodyReplace = body.replace("\n", "");
      fs.writeFile(
        __dirname + "/src/quotes.json",
        bodyReplace,
        "utf-8",
        err => {
          if (err) throw err;
          modules.log("Tạo file quotes mới thành công!");
        }
      );
    });
  }

  fs.readFile(__dirname + "/src/groupID.json", "utf-8", (err, data) => {
    if (err) throw err;
    var groupids = JSON.parse(data);
    var clock = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

    if (!fs.existsSync(__dirname + "/src/listThread.json")) {
      var firstJSON = {
        wake: [],
        sleep: [],
        fact: []
      };
      var newData = JSON.stringify(firstJSON);
      fs.writeFile(
        __dirname + "/src/listThread.json",
        newData,
        "utf-8",
        err => {
          if (err) throw err;
          modules.log("Tạo file listThread mới thành công!");
        }
      );
    }
    setInterval(() => {
      fs.readFile(__dirname + "/src/listThread.json", "utf-8", function(
        err,
        data
      ) {
        if (err) throw err;

        var oldData = JSON.parse(data);
        timer = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm");
        groupids.forEach(item => {
          while (timer == "23:00" && !oldData.sleep.includes(item)) {
            api.sendMessage(
              `Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!  `,
              item
            );
            oldData.sleep.push(item);
            break;
          }

          //chào buổi sáng
          while (timer == "07:00" && !oldData.wake.includes(item)) {
            api.sendMessage(` おはようございま các nii-chan uwu `, item);
            oldData.wake.push(item);
            break;
          }

          //những sự thật mỗi ngày
          while (timer == "08:00" && !oldData.fact.includes(item)) {
            oldData.fact.push(item);
            request(
              "https://random-word-api.herokuapp.com/word?number=1",
              (err, response, body) => {
                if (err) throw err;
                var retrieve = JSON.parse(body);
                const fact = randomfacts.make(retrieve);
                api.sendMessage(
                  '📖Fact của ngày hôm nay:\n "' + fact + '".',
                  item
                );
              }
            );
            break;
          }

          //xoá toàn bộ
          if (timer == "00:00") {
            oldData.wake = [];
            oldData.sleep = [];
            oldData.fact = [];
          }

          let newData = JSON.stringify(oldData);
          fs.writeFile(
            __dirname + "/src/listThread.json",
            newData,
            "utf-8",
            err => {
              if (err) throw err;
            }
          );
        });
      });
    }, 1000);
  });
  return function({ event }) {
    let { body: contentMessage, senderID, threadID, messageID } = event;
    senderID = parseInt(senderID);
    threadID = parseInt(threadID);
    messageID = messageID.toString();

    /* ================ Staff Commands ==================== */

    //get cmds file
    var nocmdFile = fs.readFileSync(__dirname + "/src/cmds.json");
    var nocmdData = JSON.parse(nocmdFile);

    //create new object if threadid havent got banned yet
    if (!nocmdData.banned.some(item => item.id == threadID)) {
      let addThread = {
        id: threadID,
        cmds: []
      };
      nocmdData.banned.push(addThread);
      fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(nocmdData));
    }

    //get banned commands in threadid
    var cmds = nocmdData.banned.find(item => item.id == threadID).cmds;
    for (const item of cmds) {
      if (contentMessage.indexOf(item) == 0)
        return api.sendMessage("Lệnh này đã bị cấm!", threadID);
    }

    //unban command
    if (
      contentMessage.indexOf(`${prefix}unban command`) == 0 &&
      admins.includes(senderID)
    ) {
      var content = contentMessage.slice(
        prefix.length + 14,
        contentMessage.length
      );
      if (!content)
        return api.sendMessage("Hãy nhập lệnh cần bỏ cấm!", threadID);

      fs.readFile(__dirname + "/src/cmds.json", "utf-8", (err, data) => {
        var jsonData = JSON.parse(data);
        var getCMDS = jsonData.banned.find(item => item.id == threadID).cmds;
        if (!getCMDS.includes(content))
          return api.sendMessage("Lệnh " + content + " chưa bị cấm", threadID);
        else {
          let getIndex = getCMDS.indexOf(content);
          getCMDS.splice(getIndex, 1);
          api.sendMessage(
            "Đã bỏ cấm " + content + " trong group này",
            threadID
          );
        }
        let newData = JSON.stringify(jsonData);
        fs.writeFile(__dirname + "/src/cmds.json", newData, "utf-8", err => {
          if (err) throw err;
        });
      });
      return;
    }

    //ban command
    if (
      contentMessage.indexOf(`${prefix}ban command`) == 0 &&
      admins.includes(senderID)
    ) {
      var content = contentMessage.slice(
        prefix.length + 12,
        contentMessage.length
      );
      if (!content) return api.sendMessage("Hãy nhập lệnh cần cấm!", threadID);

      fs.readFile(__dirname + "/src/cmds.json", "utf-8", (err, data) => {
        var jsonData = JSON.parse(data);
        if (!jsonData.cmds.includes(content))
          return api.sendMessage(
            "Không có lệnh " + content + " nên không thể cấm",
            threadID
          );
        else {
          if (jsonData.banned.some(item => item.id == threadID)) {
            let getThread = jsonData.banned.find(item => item.id == threadID);
            getThread.cmds.push(content);
          } else {
            let addThread = {
              id: threadID,
              cmds: []
            };
            addThread.cmds.push(content);
            jsonData.banned.push(addThread);
          }
          api.sendMessage("Đã cấm " + content + " trong group này", threadID);
        }
        let newData = JSON.stringify(jsonData);
        fs.writeFile(__dirname + "/src/cmds.json", newData, "utf-8", err => {
          if (err) throw err;
        });
      });
      return;
    }

    if (__GLOBAL.userBlocked.includes(senderID)) {
      return;
    }
    // Unban thread
    if (__GLOBAL.threadBlocked.includes(threadID)) {
      if (
        contentMessage == `${prefix}unban thread` &&
        admins.includes(senderID)
      ) {
        const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
        if (indexOfThread == -1)
          return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
        Thread.unban(threadID).then(success => {
          if (!success)
            return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
          api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
          //Clear from blocked
          __GLOBAL.threadBlocked.splice(indexOfThread, 1);
          modules.log(threadID, "Unban Thread");
        });

        return;
      }
      return;
    }

    Rank.updatePoint(senderID, 2);

    // Unban user
    if (
      contentMessage.indexOf(`${prefix}unban`) == 0 &&
      admins.includes(senderID)
    ) {
      const mentions = Object.keys(event.mentions);
      if (!mentions)
        return api.sendMessage("Vui lòng tag những người cần unban", threadID);
      mentions.forEach(mention => {
        const indexOfUser = __GLOBAL.userBlocked.indexOf(parseInt(mention));
        if (indexOfUser == -1)
          return api.sendMessage(
            {
              body: `${event.mentions[mention]} chưa bị ban, vui lòng ban trước!`,
              mentions: [
                {
                  tag: event.mentions[mention],
                  id: mention
                }
              ]
            },
            threadID
          );

        User.unban(mention).then(success => {
          if (!success)
            return api.sendMessage("Không thể unban người này!", threadID);
          api.sendMessage(
            {
              body: `Đã unban ${event.mentions[mention]}!`,
              mentions: [
                {
                  tag: event.mentions[mention],
                  id: mention
                }
              ]
            },
            threadID
          );
          //Clear from blocked
          __GLOBAL.userBlocked.splice(indexOfUser, 1);
          modules.log(mentions, "Unban User");
        });
      });
      return;
    }

    // Ban thread
    if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {
      api.sendMessage("Bạn có chắc muốn ban group này ?", threadID, function(
        error,
        info
      ) {
        if (error) return modules.log(error, 2);
        __GLOBAL.confirm.push({
          type: "ban:thread",
          messageID: info.messageID,
          target: parseInt(threadID),
          author: senderID
        });
      });
      return;
    }

    // Ban user
    if (
      contentMessage.indexOf(`${prefix}ban`) == 0 &&
      admins.includes(senderID)
    ) {
      const mentions = Object.keys(event.mentions);
      if (!mentions)
        return api.sendMessage("Vui lòng tag những người cần ban!", threadID);
      mentions.forEach(mention => {
        if (admins.includes(mention))
          return api.sendMessage(
            "Bạn không đủ thẩm quyền để ban người này?",
            threadID
          );
        api.sendMessage(
          {
            body: `Bạn có chắc muốn ban ${event.mentions[mention]}?`,
            mentions: [
              {
                tag: event.mentions[mention],
                id: mention
              }
            ]
          },
          threadID,
          function(error, info) {
            if (error) return modules.log(error, 2);
            __GLOBAL.confirm.push({
              type: "ban:user",
              messageID: info.messageID,
              target: {
                tag: event.mentions[mention],
                id: parseInt(mention)
              },
              author: senderID
            });
          }
        );
      });
      return;
    }

    //Thông báo tới toàn bộ group!
    if (
      contentMessage.indexOf(`${prefix}noti`) == 0 &&
      admins.includes(senderID)
    ) {
      var content = contentMessage.slice(
        prefix.length + 7,
        contentMessage.length
      );
      if (!content)
        return api.sendMessage("Nhập thông tin vào!", threadID, messageID);

      api.getThreadList(100, null, ["INBOX"], function(err, list) {
        if (err) throw err;
        list.forEach(item => {
          if (item.isGroup == true) api.sendMessage(content, item.threadID);
          modules.log("gửi thông báo mới thành công!");
        });
      });
      return;
    }

    //giúp thành viên thông báo lỗi về admin
    if (contentMessage.indexOf(`${prefix}report`) == 0) {
      var clock = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
      var reportID = Math.floor(Math.random() * (1e4 + 1 - 1e5)) + 1e4;
      var content = contentMessage.slice(
        prefix.length + 7,
        contentMessage.length
      );
      if (!content)
        return api.sendMessage(
          " Có vẻ như bạn chưa nhập thông tin, vui lòng nhập thông tin lỗi mà bạn gặp!",
          threadID,
          messageID
        );
      api.sendMessage(
        " Có báo cáo lỗi mới từ id: " +
          senderID +
          " id support " +
          reportID +
          "\n - ThreadID gặp lỗi: " +
          threadID +
          "\n - Lỗi gặp phải: " +
          content +
          " \n - lỗi được thông báo vào lúc: " +
          clock,
        admins[0]
      );
      api.sendMessage(
        "Thông tin lỗi của bạn đã được gửi về admin!, đây là id hỗ trợ của bạn: " +
          reportID,
        threadID,
        messageID
      );
      return;
    }

    //boost rank
    if (
      contentMessage.indexOf(`${prefix}boostrank`) == 0 &&
      admins.includes(senderID)
    ) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var content = contentMessage
          .slice(prefix.length + 10, contentMessage.length)
          .trim();
        if (!content)
          return api.sendMessage(
            `Chưa nhập thông tin kìa bạn eii`,
            threadID,
            messageID
          );
        var split = content.split(" ");
        var point = split[2];
        var tag = split[1];
        Rank.updatePoint(Object.keys(event.mentions)[i], point);
        api.sendMessage(
          {
            body: tag + " Đã được boost thêm: " + point + " điểm",
            mentions: [
              {
                tag: tag,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID,
          messageID
        );
        modules.log(Rank.getPoint(Object.keys(event.mentions)[i]));
      }
      return;
    }

    //reset điểm
    if (
      contentMessage.indexOf(`${prefix}reset`) == 0 &&
      admins.includes(senderID)
    ) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var content = contentMessage
          .slice(prefix.length + 6, contentMessage.length)
          .trim();
        if (!content)
          return api.sendMessage(
            `Chưa nhập thông tin kìa bạn eii`,
            threadID,
            messageID
          );
        var split = content.split(" ");
        var tag = split[1];
        Rank.setDefault(Object.keys(event.mentions)[i]);
        api.sendMessage(
          {
            body: tag + " Đã reset điểm",
            mentions: [
              {
                tag: tag,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID,
          messageID
        );
      }
      return;
    }
    
    //get ids
    if (contentMessage == `${prefix}getids` && admins.includes(senderID)) {
      var data = [];
      api.getThreadList(100, null, ["INBOX"], function(err, list) {
        if (err) throw err;
        list.forEach(item => {
          if (item.isGroup == true) {
            data.push(item.threadID);
          }
        });
        console.log(data);
        fs.writeFile(
          __dirname + "/src/groupID.json",
          JSON.stringify(data),
          err => {
            if (err) throw err;
            modules.log("Tạo file groupID mới thành công!");
          }
        );
      });
      return;
    }

    /* ==================== Help Commands ================*/

    // add thêm lệnh cho help
    if (
      contentMessage.indexOf(`${prefix}sethelp`) == 0 &&
      admins.includes(senderID)
    ) {
      var string = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      ); //name|decs|usage|example|group
      if (string.length == 0)
        return api.sendMessage(
          "error: content Not Found!",
          threadID,
          messageID
        );

      stringIndexOf = string.indexOf("|");
      name = string.slice(0, stringIndexOf); //name
      center = string.slice(stringIndexOf + 1, string.length); //decs|usage|example|group

      stringIndexOf2 = center.indexOf("|");
      decs = center.slice(0, stringIndexOf2); //decs
      stringNext = center.slice(stringIndexOf2 + 1, center.length); //usage|example|group

      stringIndexOf3 = stringNext.indexOf("|");
      usage = stringNext.slice(0, stringIndexOf3); //usage
      stringNext2 = stringNext.slice(stringIndexOf3 + 1, stringNext.length); //example|group

      stringIndexOf4 = stringNext2.indexOf("|");
      example = stringNext2.slice(0, stringIndexOf4); //example
      group = stringNext2.slice(stringIndexOf4 + 1, stringNext2.length); //group

      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          var oldDataJSON = JSON.parse(data);
          var pushJSON = {
            name: name,
            decs: decs,
            usage: usage,
            example: example,
            group: group
          };
          oldDataJSON.push(pushJSON);
          let newData = JSON.stringify(oldDataJSON);
          fs.writeFile(
            __dirname + "/src/listCommands.json",
            newData,
            "utf-8",
            err => {
              if (err) throw err;
              api.sendMessage("Ghi lệnh mới hoàn tất!", threadID, messageID);
            }
          );
        }
      );

      return;
    }

    //delete lệnh trong help
    if (
      contentMessage.indexOf(`${prefix}delhelp`) == 0 &&
      admins.includes(senderID)
    ) {
      var string = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      );
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          var oldDataJSON = JSON.parse(data);
          /*var pushJSON = oldDataJSON.filter(object => {
            return object.name !== string;
          }); */
          const index = oldDataJSON.findIndex(x => x.name === string);

          if (index !== undefined) oldDataJSON.splice(index, 1);
          // oldDataJSON.push(pushJSON);
          let newData = JSON.stringify(oldDataJSON);
          api.sendMessage(newData, threadID, messageID);
          fs.writeFile(
            __dirname + "/src/listCommands.json",
            newData,
            "utf-8",
            err => {
              if (err) throw err;
              api.sendMessage("Ghi lệnh mới hoàn tất!", threadID, messageID);
            }
          );
        }
      );
      return;
    }

    //export file json
    if (contentMessage == `${prefix}extracthelp` && admins.includes(senderID)) {
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          api.sendMessage(data, threadID, messageID);
        }
      );
      return;
    }

    if (contentMessage.indexOf(`${prefix}help`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(
          "Để biết tất cả các lệnh bot, hãy sử dụng !help all",
          threadID,
          messageID
        );

      if (content == "all") {
        fs.readFile(
          __dirname + "/src/listCommands.json",
          "utf-8",
          (err, data) => {
            if (err) throw err;
            var helpMe = JSON.parse(data);
            var helpList = [];
            var helpName = "";
            helpMe.forEach(item => {
              helpList.push(item.name);
            });
            helpList.map(item => {
              helpName = helpName + item + ", ";
            });
            helpName = helpName.slice(0, -2);

            return api.sendMessage(
              "Đây là toàn bộ lệnh của bot: " + helpName,
              threadID,
              messageID
            );
          }
        );
        return;
      }
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err)
            return api.sendMessage(
              "Đã xảy ra lỗi không mong muốn!",
              threadID,
              messageID
            );
          var helpMe = JSON.parse(data);
          if (helpMe.some(item => item.name == content)) {
            api.sendMessage(
              `Thông tin lệnh bạn đang tìm: \n - tên: ${
                helpMe.find(item => item.name == content).name
              } \n - Thông tin: ${
                helpMe.find(item => item.name == content).decs
              } \n - usage: ${
                helpMe.find(item => item.name == content).usage
              } \n - Hướng dẫn sử dụng: ${
                helpMe.find(item => item.name == content).example
              } \n - Thuộc loại: ${
                helpMe.find(item => item.name == content).group
              }`,
              threadID,
              messageID
            );
          } else {
            var helpList = [];
            var helpName = "";
            helpMe.forEach(item => {
              if (content !== item.name) helpList.push(item.name);
            });
            helpList.map(item => {
              helpName = helpName + item + ", ";
            });
            helpName = helpName.slice(0, -2);
            return api.sendMessage(
              "Lệnh bạn nhập không tồn tại, đây là danh sách lệnh của bot: " +
                helpName,
              threadID,
              messageID
            );
          }
        }
      );
      return;
    }

    //yêu cầu công việc cho bot
    if (contentMessage.indexOf(`${prefix}request`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      );
      //console.log(content);
      if (!fs.existsSync(__dirname + "/src/requestList.json")) {
        let requestList = [];
        fs.writeFileSync(
          __dirname + "/src/requestList.json",
          JSON.stringify(requestList)
        );
      }

      if (content.indexOf("add") == 0) {
        var addnew = content.slice(4, content.length);
        var getList = fs.readFileSync(__dirname + "/src/requestList.json");
        var getData = JSON.parse(getList);
        getData.push(addnew);
        fs.writeFileSync(
          __dirname + "/src/requestList.json",
          JSON.stringify(getData)
        );
        return api.sendMessage(
          "Đã thêm '" + addnew + "' vào request list",
          threadID,
          () => {
            api.sendMessage(
              " ID " + senderID + " Đã thêm '" + addnew + "' vào request list",
              admins[0]
            );
          },
          messageID
        );
      } else if (content.indexOf("del") == 0 && admins.includes(senderID)) {
        var deletethisthing = content.slice(4, content.length);
        var getList = fs.readFileSync(__dirname + "/src/requestList.json");
        var getData = JSON.parse(getList);
        if (getData.length == 0)
          return api.sendMessage(
            "Không tìm thấy " + deletethisthing,
            threadID,
            messageID
          );
        var itemIndex = getData.indexOf(deletethisthing);
        getData.splice(itemIndex, 1);
        fs.writeFileSync(
          __dirname + "/src/requestList.json",
          JSON.stringify(getData)
        );
        return api.sendMessage(
          "Đã xóa: " + deletethisthing,
          threadID,
          messageID
        );
      } else if (content.indexOf("list") == 0) {
        var getList = fs.readFileSync(__dirname + "/src/requestList.json");
        var getData = JSON.parse(getList);
        if (getData.length == 0)
          return api.sendMessage("Không có việc cần làm", threadID, messageID);
        let allWorks = "";
        getData.map(item => {
          allWorks = allWorks + `\n- ` + item;
        });
        return api.sendMessage(
          "Đây là toàn bộ yêu cầu mà các bạn đã gửi:" + allWorks,
          threadID,
          messageID
        );
      }
    }

    /* ==================== Genarate Commands ================*/

    if (contentMessage.indexOf(`${prefix}anime`) == 0) {
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const request = require("request");
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      var jsonData = fs.readFileSync(__dirname + "/src/endpoints.json");
      var data = JSON.parse(jsonData);
      var baseURL = "https://nekos.life/api/v2";
      var url = "";

      let sfwList = [];
      let sfwTags = "";
      Object.keys(data.sfw).forEach(endpoint => {
        sfwList.push(endpoint);
      });
      sfwList.map(item => {
        sfwTags = sfwTags + item + ", ";
      });
      sfwTags = sfwTags.slice(0, -2);

      let nsfwList = [];
      let nsfwTags = "";
      Object.keys(data.nsfw).forEach(endpoint => {
        nsfwList.push(endpoint);
      });
      nsfwList.map(item => {
        nsfwTags = nsfwTags + item + ", ";
      });
      nsfwTags = nsfwTags.slice(0, -2);

      if (data.sfw.hasOwnProperty(content)) url = data.sfw[content];
      else if (data.nsfw.hasOwnProperty(content)) url = data.nsfw[content];
      else if (
        !content ||
        !data.nsfw.hasOwnProperty(content) ||
        !data.sfw.hasOwnProperty(content)
      )
        return api.sendMessage(
          `=== Tất cả các tag SFW ===\n` +
            sfwTags +
            `\n\n=== Tất cả các tag NSFW ===\n` +
            nsfwTags,
          threadID,
          messageID
        );

      request(
        {
          uri: url
        },
        (error, response, body) => {
          let picData = JSON.parse(body);
          let getURL = picData.url;
          let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
          let callback = function() {
            let up = {
              body: "",
              attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
            };
            api.sendMessage(up, threadID, () => {
              fs.unlinkSync(__dirname + `/src/anime.${ext}`)
            }, messageID);
          };
          request(getURL)
            .pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`))
            .on("close", callback);
        }
      );
      return;
    }

    //meme
    if (contentMessage == `${prefix}meme`) {
      request(
        "https://meme-api.herokuapp.com/gimme/memes",
        (err, response, body) => {
          if (err) throw err;
          var content = JSON.parse(body);
          let title = content.title;
          var baseurl = content.url;

          let callback = function() {
            let up = {
              body: `${title}`,
              attachment: fs.createReadStream(__dirname + "/src/meme.jpg")
            };
            api.sendMessage(up, threadID, () => {
              fs.unlinkSync(__dirname + "/src/meme.jpg")
            }, messageID);
          };
          request(baseurl)
            .pipe(fs.createWriteStream(__dirname + `/src/meme.jpg`))
            .on("close", callback);
        }
      );
     return;
    }

    if (contentMessage == `pls loli`) {
      request(
        "https://api.lolis.life/random?category=kawaii",
        (err, response, body) => {
          var data = JSON.parse(body);
          var baseurl = data.url;
          let callback = function() {
            let up = {
              body: ``,
              attachment: fs.createReadStream(__dirname + "/src/randompic.png")
            };
            api.sendMessage(up, threadID, messageID);
            fs.unlinkSync(__dirname + "/src/randompic.png");
          };

          request(baseurl)
            .pipe(fs.createWriteStream(__dirname + "/src/randompic.png"))
            .on("close", callback);
        }
      );
      return;
    }

    if (contentMessage.indexOf(`${prefix}gif`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 4,
        contentMessage.length
      );
      if (content.length == -1)
        return api.sendMessage(
          `Bạn đã nhập sai format, vui lòng !help gif để biết thêm chi tiết!`,
          threadID,
          messageID
        );
      if (content.indexOf(`cat`) !== -1) {
        request(
          `https://api.tenor.com/v1/random?key=${tenor}&q=cat&limit=1`,
          (err, response, body) => {
            if (err) throw err;
            var string = JSON.parse(body);
            var stringURL = string.results[0].media[0].tinygif.url;
            console.log(stringURL);
            let callback = function() {
              let up = {
                body: "",
                attachment: fs.createReadStream(
                  __dirname + `/src/randompic.gif`
                )
              };
              api.sendMessage(up, threadID, () =>
                fs.unlinkSync(__dirname + `/src/randompic.gif`)
              );
            };
            request(stringURL)
              .pipe(fs.createWriteStream(__dirname + `/src/randompic.gif`))
              .on("close", callback);
          }
        );
        return;
      } else if (content.indexOf(`dog`) !== -1) {
        request(
          `https://api.tenor.com/v1/random?key=${tenor}&q=dog&limit=1`,
          (err, response, body) => {
            if (err) throw err;
            var string = JSON.parse(body);
            var stringURL = string.results[0].media[0].tinygif.url;
            console.log(stringURL);
            let callback = function() {
              let up = {
                body: "",
                attachment: fs.createReadStream(
                  __dirname + "/src/randompic.gif"
                )
              };
              api.sendMessage(up, threadID, () =>
                fs.unlinkSync(__dirname + "/src/randompic.gif")
              );
            };
            request(stringURL)
              .pipe(fs.createWriteStream(__dirname + "/src/randompic.gif"))
              .on("close", callback);
          }
        );
        return;
      } else if (content.indexOf(`capoo`) !== -1) {
        request(
          `https://api.tenor.com/v1/random?key=${tenor}&q=capoo&limit=1`,
          (err, response, body) => {
            if (err) throw err;
            var string = JSON.parse(body);
            var stringURL = string.results[0].media[0].tinygif.url;
            console.log(stringURL);
            let callback = function() {
              let up = {
                body: "",
                attachment: fs.createReadStream(
                  __dirname + "/src/randompic.gif"
                )
              };
              api.sendMessage(up, threadID, () =>
                fs.unlinkSync(__dirname + "/src/randompic.gif")
              );
            };
            request(stringURL)
              .pipe(fs.createWriteStream(__dirname + "/src/randompic.gif"))
              .on("close", callback);
          }
        );
        return;
      } else if (content.indexOf(`mixi`) !== -1) {
        request(
          `https://api.tenor.com/v1/random?key=${tenor}&q=mixigaming&limit=1`,
          (err, response, body) => {
            if (err) throw err;
            var string = JSON.parse(body);
            var stringURL = string.results[0].media[0].tinygif.url;
            console.log(stringURL);
            let callback = function() {
              let up = {
                body: "",
                attachment: fs.createReadStream(
                  __dirname + "/src/randompic.gif"
                )
              };
              api.sendMessage(up, threadID, () =>
                fs.unlinkSync(__dirname + "/src/randompic.gif")
              );
            };
            request(stringURL)
              .pipe(fs.createWriteStream(__dirname + "/src/randompic.gif"))
              .on("close", callback);
          }
        );
        return;
      } else if (content.indexOf(`bomman`) !== -1) {
        request(
          `https://api.tenor.com/v1/random?key=${tenor}&q=bommanrage&limit=1`,
          (err, response, body) => {
            if (err) throw err;
            var string = JSON.parse(body);
            var stringURL = string.results[0].media[0].tinygif.url;
            console.log(stringURL);
            let callback = function() {
              let up = {
                body: "",
                attachment: fs.createReadStream(
                  __dirname + "/src/randompic.gif"
                )
              };
              api.sendMessage(up, threadID, () =>
                fs.unlinkSync(__dirname + "/src/randompic.gif")
              );
            };
            request(stringURL)
              .pipe(fs.createWriteStream(__dirname + "/src/randompic.gif"))
              .on("close", callback);
          }
        );
        return;
      }

      return;
    }

    /* ==================== General Commands ================ */

    //wiki
    if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
      const wiki = require("wikijs").default;
      var url = "https://vi.wikipedia.org/w/api.php";
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (contentMessage.indexOf("en") == 6) {
        url = "https://en.wikipedia.org/w/api.php";
        content = contentMessage.slice(
          prefix.length + 8,
          contentMessage.length
        );
      }
      if (!content)
        return api.sendMessage("Nhập thứ cần tìm!", threadID, messageID);
      wiki({ apiUrl: url })
        .page(content)
        .catch(err =>
          api.sendMessage(
            "Không tìm thấy thông tin bạn cần",
            threadID,
            messageID
          )
        )
        .then(page => {
          if (typeof page == "undefined") return;
          Promise.resolve(page.summary()).then(val =>
            api.sendMessage(val, threadID, messageID)
          );
        });
      return;
    }

    //ping
    if (contentMessage == `${prefix}ping`) {
      api.getThreadInfo(threadID, function(err, info) {
        if (err) throw err;
        ids = info.participantIDs;
        botid = api.getCurrentUserID();
        callid = {
          body: "Ping🏓",
          mentions: [
            {
              tag: `${botid}`,
              id: botid
            }
          ]
        };
        ids.forEach(getid => {
          addthis = {
            tag: `${getid}`,
            id: getid
          };
          callid["mentions"].push(addthis);
        });
        api.sendMessage(callid, threadID, messageID);
      });
      return;
    }
    
    //gọi bot
    if (contentMessage == `${prefix}sumi` || contentMessage.indexOf('sumi') == 0)
      return api.sendMessage(`Dạ gọi Sumi ạ?`, threadID, messageID);

    //lenny
    if (contentMessage == `${prefix}lenny` || contentMessage.indexOf('lenny') == 0)
      return api.sendMessage("( ͡° ͜ʖ ͡°) ", threadID, messageID);

    //hug
    if (contentMessage == `${prefix}hug` || contentMessage.indexOf('hug') == 0)
      return api.sendMessage(" (つ ͡° ͜ʖ ͡°)つ  ", threadID, messageID);

    //mlem
    if (contentMessage == `${prefix}mlem` || contentMessage.indexOf('mlem') == 0)
      return api.sendMessage(" ( ͡°👅 ͡°)  ", threadID, messageID);
    //care
    if (contentMessage == `${prefix}care` || contentMessage.indexOf('care') == 0)
      return api.sendMessage("¯\\_(ツ)_/¯", threadID, messageID);

    //prefix
    if (contentMessage.indexOf(`prefix`) == 0)
      return api.sendMessage(`Prefix is: ${prefix}`, threadID, messageID);

    if (contentMessage.indexOf("credits") == 0)
      return api.sendMessage(
        "Project Sumi-chan-bot được thực hiện bởi:\n SpermLord: https://www.facebook.com/LiterallyASperm \n CatalizCS: https://www.facebook.com/Cataliz2k\n Full source code at: https://github.com/roxtigger2003/Sumi-chan-bot",
        threadID,
        messageID
      );

    //simsimi
    if (contentMessage.indexOf(`${prefix}sim`) == 0) {
      var content = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      if (!content)
        return api.sendMessage("Nhập tin nhắn!", threadID, messageID);

      let url = `http://ghuntur.com/simsim.php?lc=vn&deviceId=&bad=0&txt=${content}`;
      url = encodeURI(url);
      request(
        {
          uri: url
        },
        function(error, response, body) {
          if (
            body.indexOf(
              "https://play.google.com/store/apps/details?id=livemeet.app.com"
            ) !== -1
          )
            return api.sendMessage('sim chả hiểu bạn nói gì "/', threadID);
          api.sendMessage(body, threadID, messageID);
        }
      );
      return;
    }
    
    //thời tiết
    if (contentMessage.indexOf(`${prefix}weather`) == 0) {
      var city = contentMessage.slice(prefix.length + 8, contentMessage.length);
      if (city.length == 0)
        return api.sendMessage(
          ` Bạn chưa nhập thành phố, hãy đọc hướng dẫn tại ${prefix}help weather !`,
          threadID,
          messageID
        );
      baseurl =
        "https://api.openweathermap.org/data/2.5/weather?q=" +
        city +
        "&appid=" +
        openweather +
        "&units=metric&lang=vi";
      var baseurl = encodeURI(baseurl);

      request(baseurl, (err, response, body) => {
        if (err) throw err;
        var weatherData = JSON.parse(body);

        if (weatherData.cod !== 200)
          return api.sendMessage(
            `Thành phố ${city} không tồn tại!!`,
            threadID,
            messageID
          );
        api.sendMessage(
          `☁️ thời tiết
------------------------------
🗺Địa Điểm: ` +
            weatherData.name +
            `\n - 🌡nhiệt độ hiện tại: ` +
            weatherData.main.temp +
            `°C \n - ☁️Bầu trời: ` +
            weatherData.weather[0].description +
            `\n - 💦độ ẩm trong không khí: ` +
            weatherData.main.humidity +
            `% \n - 💨tốc độ gió: ` +
            weatherData.wind.speed +
            `km/h `,
          threadID,
          messageID
        );
      });
      return;
    }

    //say
    if (contentMessage.indexOf(`${prefix}say`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 4,
        contentMessage.length
      );

      let callback = function() {
        let m = {
          body: "",
          attachment: fs.createReadStream(__dirname + "/src/say.mp3")
        };
        api.sendMessage(m, threadID, () => {
          fs.unlinkSync(__dirname + "/src/say.mp3");
        });
      };
      if (contentMessage.indexOf("jp") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.length),
          "ja",
          callback
        );
      else if (contentMessage.indexOf("en") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.length),
          "en-US",
          callback
        );
      else if (contentMessage.indexOf("ko") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.lenght),
          "ko",
          callback
        );
      else if (contentMessage.indexOf("ru") == 5)
        tts.other(
          contentMessage.slice(prefix.lenght + 7, contentMessage.lenght),
          "ru",
          callback
        );
      else tts.vn(content, callback);
      return;
    }

    //cập nhật tình hình dịch
    if (contentMessage == `${prefix}corona`) {
      var baseurl = "https://code.junookyo.xyz/api/ncov-moh/data.json";

      request(baseurl, (err, response, body) => {
        if (err) throw err;
        var data = JSON.parse(body);
        api.sendMessage(
          "Thế giới: \n - Nhiễm: " +
            data.data.global.cases +
            "\n - Chết: " +
            data.data.global.deaths +
            "\n - Hồi phục: " +
            data.data.global.recovered +
            "\nViệt Nam:\n - Nhiễm: " +
            data.data.vietnam.cases +
            "\n - Chết: " +
            data.data.vietnam.deaths +
            "\n - Phục hồi: " +
            data.data.vietnam.recovered,
          threadID,
          messageID
        );
      });
      return;
    }

    //tuỳ chọn
    if (contentMessage.indexOf(`${prefix}choose`) == 0) {
      var input = contentMessage
        .slice(prefix.length + 7, contentMessage.length)
        .trim();
      if (input.lenght == 0)
        return api.sendMessage(
          `Bạn không nhập đủ thông tin kìa :(`,
          threadID,
          messageID
        );
      var array = input.split(" | ");
      var rand = Math.floor(Math.random() * array.length);

      api.sendMessage(
        `hmmmm, em sẽ chọn giúp cho là: ` + array[rand] + `.`,
        threadID,
        messageID
      );
      return;
    }

    //waifu
    if (contentMessage === `${prefix}waifu`) {
      var route = Math.round(Math.random() * 10);
      if (route == 1 || route == 0) {
        api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
        api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
        return;
      } else if (route == 2) {
        api.sendMessage("Làm Bạn thôi nhé :'(", threadID, messageID);
        return;
      } else if (route == 3) {
        api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
        api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
        return;
      } else if (route > 4) {
        api.sendMessage("-.-", threadID, messageID);
        api.sendMessage("Chúng ta chỉ là bạn thôi :'(", threadID, messageID);
        return;
      }
    }

    //ramdom con số
    if (contentMessage == `${prefix}roll`) {
      var roll = Math.round(Math.random() * 100);
      api.sendMessage("UwU Your Number is " + roll + " ", threadID, messageID);
      return;
    }

    //tát người bạn
    if (contentMessage.indexOf(`${prefix}tát`) == 0) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var x = contentMessage
          .slice(prefix.length + 5, contentMessage.length)
          .trim();
        api.sendMessage(
          {
            body: x + " Vừa Bị Vả Vỡ Mồm \n",
            mentions: [
              {
                tag: x,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID,
          messageID
        );
      }
      return;
    }

    if (contentMessage.indexOf(`${prefix}đấm`) == 0) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var x = contentMessage
          .slice(prefix.length + 4, contentMessage.length)
          .trim();
        api.sendMessage(
          {
            body: x + " vừa bị đấm cho thọt 2 hòn lên họng",
            mentions: [
              {
                tag: x,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID,
          messageID
        );
      }
      return;
    }

    //Khiến bot nhái lại tin nhắn bạn
    if (contentMessage.indexOf(`${prefix}echo`) == 0) {
      let echotext = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      if (
        echotext.indexOf(`${prefix}ban`) !== -1 ||
        echotext.indexOf(`${prefix}unban`) !== -1 ||
        echotext.indexOf(`${prefix}getname`) !== -1 ||
        echotext.indexOf(`${prefix}update`) !== -1 ||
        echotext.indexOf(`${prefix}boostrank`) !== -1 ||
        echotext.indexOf(`${prefix}reset`) !== -1 ||
        echotext.indexOf(`${prefix}delhelp`) !== -1 ||
        echotext.indexOf(`${prefix}sethelp`) !== -1 ||
        echotext.indexOf(`${prefix}deletejson`) !== -1 ||
        echotext.indexOf(`${prefix}extracthelp`) !== -1 ||
        echotext.indexOf(`${prefix}ban command`) !== -1 ||
        echotext.indexOf(`${prefix}unban command`) !== -1
      )
        return api.sendMessage(`Định làm gì đếy?`, threadID, messageID);
      api.sendMessage(`${echotext}`, threadID);
      return;
    }

    //rank
    if (contentMessage.indexOf(`${prefix}rank`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (content.length == 0) {
        api.getUserInfo(senderID, (err, result) => {
          if (err) return modules.log(err, 2);
          const { name } = result[senderID];

          Rank.getPoint(senderID)
            .then(point => createCard({ id: senderID, name, ...point }))
            .then(path =>
              api.sendMessage(
                { body: "", attachment: fs.createReadStream(path) },
                threadID,
                () => {
                  fs.unlinkSync(path);
                },
                messageID
              )
            );
        });
        return;
      } else if (content.indexOf("@") !== -1) {
        for (var i = 0; i < Object.keys(event.mentions).length; i++) {
          let id = Object.keys(event.mentions)[i];
          console.log(id);
          api.getUserInfo(id, (err, result) => {
            if (err) return modules.log(err, 2);
            const { name } = result[id];
            console.log(name);

            Rank.getPoint(id)
              .then(point => createCard({ id: id, name, ...point }))
              .then(path =>
                api.sendMessage(
                  { body: "", attachment: fs.createReadStream(path) },
                  threadID,
                  () => {
                    fs.unlinkSync(path);
                  },
                  messageID
                )
              );
          });
        }

        return;
      } else if (!content) {
        api.getUserInfo(content, (err, result) => {
          if (err) return modules.log(err, 2);
          const { name } = result[content];

          Rank.getPoint(content)
            .then(point => createCard({ id: content, name, ...point }))
            .then(path =>
              api.sendMessage(
                { body: "", attachment: fs.createReadStream(path) },
                threadID,
                () => {
                  fs.unlinkSync(path);
                },
                messageID
              )
            );
        });

        return;
      }
      return;
    }

    //dịch ngôn ngữ
    if (contentMessage.indexOf(`${prefix}trans`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(
          "Bạn chưa nhập thông tin, vui lòng đọc !help để biết thêm chi tiết!",
          threadID,
          messageID
        );
      if (content.indexOf("->") !== -1) {
        var string = content.indexOf("->");
        var rightString = content.slice(string + 2, string.length);
        var leftString = content.slice(0, string - 1);
        console.log(rightString + leftString);
        if (rightString.length !== 0 && leftString.length !== 0) {
          var baseurl =
            "https://translate.yandex.net/api/v1.5/tr.json/translate?key=" +
            yandex +
            "&text=" +
            leftString +
            "&lang=" +
            rightString;
          var baseurl = encodeURI(baseurl);
          request({ uri: baseurl }, (err, response, body) => {
            console.log(body);
            console.log(yandex);
            var retrieve = JSON.parse(body);
            convert = retrieve.text[0];
            language = retrieve.lang;
            splitLang = language.split("-");
            fromLang = splitLang[0];
            toLang = splitLang[1];
            console.log(retrieve.code);
            console.log(convert);
            if (err)
              return api.sendMessage(
                "Server đã xảy ra vấn đề, vui lòng báo lại cho admin!!!",
                threadID,
                messageID
              );
            api.sendMessage(
              " '" + convert + "' được dịch từ " + fromLang + " sang " + toLang,
              threadID,
              messageID
            );
          });
          return;
        } else {
          api.sendMessage(
            " Bạn đã nhập sai format! vui lòng đọc hướng dẫn sử dụng trong !help",
            threadID,
            messageID
          );
          return;
        }
      }
      return;
    }

    //châm ngôn sống
    if (contentMessage == `${prefix}quotes`) {
      fs.readFile(__dirname + "/src/quotes.json", "utf-8", function(err, data) {
        var stringData = JSON.parse(data);
        randomQuotes =
          stringData[Math.floor(Math.random() * stringData.length)];
        api.sendMessage(
          'Quote: \n "' +
            randomQuotes.text +
            '"\n     -' +
            randomQuotes.author +
            "-",
          threadID,
          messageID
        );
      });
      return;
    }

    //khiến bot làm toán ?!
    if (contentMessage.indexOf(`${prefix}math`) == 0) {
      const wolfram =
        "http://api.wolframalpha.com/v2/result?appid=" + wolfarm + "&i=";
      var m = contentMessage.slice(prefix.length + 5, contentMessage.length);
      var o = m.replace(/ /g, "+");
      var l = "http://lmgtfy.com/?q=" + o;
      request(wolfram + encodeURIComponent(m), function(err, response, body) {
        if (body.toString() === "Wolfram|Alpha did not understand your input") {
          api.sendMessage(l, threadID, messageID);
        } else if (
          body.toString() === "Wolfram|Alpha did not understand your input"
        ) {
          api.sendMessage(
            "I Don't understand your question :3 ",
            threadID,
            messageID
          );
        } else if (body.toString() === "My name is Wolfram Alpha.") {
          api.sendMessage("My name is Sumi-chan.", threadID, messageID);
        } else if (
          body.toString() === "I was created by Stephen Wolfram and his team."
        ) {
          api.sendMessage(
            "I Was Created by Catalizcs, I love him too <3",
            threadID,
            messageID
          );
        } else if (
          body.toString() ===
          "I am not programmed to respond to this dialect of English."
        ) {
          api.sendMessage(
            "Tôi không được lập trình để nói những thứ vô học như này\n:)",
            threadID,
            messageID
          );
        } else if (
          body.toString() ===
          "StringJoin(CalculateParse`Content`Calculate`InternetData(Automatic, Name))"
        ) {
          api.sendMessage(
            "I Don't know how to answer this question",
            threadID,
            messageID
          );
        } else api.sendMessage(body, threadID, messageID);
        return;
      });
      return;
    }

    //time
    if (contentMessage.indexOf(`${prefix}time`) == 0) {
      const cityTimezones = require("city-timezones");
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (!content) return api.sendMessage("Nhập thành phố!", threadID);
      var timezones = cityTimezones.lookupViaCity(content);
      var timezone = "";
      var cityname = "";
      for (let item of timezones) {
        timezone = item.timezone;
        cityname = item.city;
      }
      if (
        cityname.length == 0 ||
        cityname == "" ||
        timezone.length == 0 ||
        timezone == 0
      )
        return api.sendMessage("Không tìm thấy " + content, threadID);
      api.sendMessage(
        "Thời gian hiện tại ở địa điểm " +
          cityname +
          " đang là " +
          moment.tz(timezone).format("HH:mm"),
        threadID
      );
      return;
    }

    if (contentMessage == `${prefix}uptime`) {
      var seconds = process.uptime();
      var hours = Math.floor(seconds / (60 * 60));
      var minutes = Math.floor((seconds % (60 * 60)) / 60);
      var seconds = Math.floor(seconds % 60);
      api.sendMessage(
        "Bot đã hoạt động được " +
          hours +
          " Giờ " +
          minutes +
          " Phút " +
          seconds +
          " Giây. \nLưu ý: Bot sẽ tự động restart sau khi 30 phút hoạt động!",
        threadID,
        messageID
      );
      return;
    }

    //unsend message
    if (contentMessage.indexOf(`${prefix}gỡ`) == 0) {
      if (event.messageReply.senderID != api.getCurrentUserID())
        return api.sendMessage(
          "Không thể gỡ tin nhắn của người khác",
          threadID,
          messageID
        );
      if (event.type != "message_reply")
        return api.sendMessage("Phản hồi tin nhắn cần gỡ", threadID, messageID);
      var delMessageID = event.messageReply.messageID;
      //console.log(delMessageID);
      api.unsendMessage(delMessageID, err => {
        if (err)
          return api.sendMessage(
            "Không thể gỡ tin nhắn này vì đã quá 10 phút!",
            threadID,
            messageID
          );
        api.sendMessage("Đã gỡ tin nhắn thành công!", threadID);
      });
      return;
    }

    /* ==================== NSFW Commands ==================== */

    //nhentai ramdom code
    if (contentMessage == `${prefix}nhentai -r`) {
      let ramdomnhentai = Math.floor(Math.random() * 99999);
      api.sendMessage(
        `Code lý tưởng của nii-chan là: ${ramdomnhentai}`,
        threadID,
        messageID
      );
      return;
    }

    //nhentai search
    if (contentMessage.indexOf(`${prefix}nhentai -i`) == 0) {
      var id = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();
      if (!id) return api.sendMessage("Nhập id!", threadID);
      let url = "https://nhentai.net/api/gallery/" + id;
      let filename = __dirname + "/src/nhentai/" + id + ".json";
      request(
        {
          uri: url
        },
        function(error, response, body) {
          fs.writeFile(filename, body, "utf-8", err => {
            if (err) throw err;
            fs.readFile(filename, "utf-8", (err, data) => {
              if (err) throw err;
              let codeData = "";
              try {
                codeData = JSON.parse(data);
              } catch (err) {
                fs.unlinkSync(filename);
                return api.sendMessage(
                  "Không tìm thấy truyện này",
                  threadID,
                  messageID
                );
              }
              if (codeData.error == true)
                return api.sendMessage(
                  "Không tìm thấy truyện này",
                  threadID,
                  () => {
                    fs.unlinkSync(filename);
                  },
                  messageID
                );
              let title = codeData.title.pretty;
              let numpages = codeData.num_pages;
              let tagsList = [];
              let tags = "";
              let artistsList = [];
              let artists = "";

              codeData.tags.forEach(item => {
                if (item.type == "tag") tagsList.push(item.name);
                else if (item.type == "artist") artistsList.push(item.name);
              });
              tagsList.map(item => {
                tags = tags + item + ", ";
              });
              artistsList.map(item => {
                artists = artists + item + ", ";
              });
              tags = tags.slice(0, -2);
              artists = artists.slice(0, -2);

              api.sendMessage("Tiêu đề: " + title, threadID, () => {
                api.sendMessage("Tác giả: " + artists, threadID, () => {
                  api.sendMessage("Tags: " + tags, threadID, () => {
                    api.sendMessage("Số trang: " + numpages, threadID, () => {
                      api.sendMessage(
                        "Link: https://nhentai.net/g/" + id,
                        threadID,
                        () => {
                          fs.unlinkSync(filename);
                        }
                      );
                    });
                  });
                });
              });
            });
          });
        }
      );
      return;
    }

    //hentaivn
    if (contentMessage.indexOf(`${prefix}hentaivn -i`) == 0) {
      const jsdom = require("jsdom");
      const { JSDOM } = jsdom;
      var id = contentMessage.slice(prefix.length + 12, contentMessage.length);
      if (!id) return api.sendMessage("Nhập id!", threadID);
      let url = "https://hentaivn.net/id" + id;
      let filename = __dirname + "/src/hentaivn/" + id + ".html";
      request(
        {
          uri: url
        },
        function(error, response, body) {
          fs.writeFile(filename, body, "utf-8", err => {
            if (err) throw err;
            const dom = new JSDOM(fs.readFileSync(filename));
            var result = [];
            var name = dom.window.document.querySelector("h2").textContent;
            var link = dom.window.document.querySelector("form").action;
            var all = dom.window.document.querySelectorAll("a");
            var tags = "";
            for (var i = 0; i < all.length; i++) {
              result.push(all[i].textContent);
            }
            result.map(item => {
              tags = tags + item + ", ";
            });
            tags = tags.slice(0, -2);
            link = link.slice(0, 17) + " " + link.slice(17);
            if (
              name.length == 0 ||
              tags.length == 0 ||
              link == "/tim-kiem-truyen. html"
            ) {
              fs.unlinkSync(filename);
              return api.sendMessage("Không tìm thấy truyện này", threadID);
            }
            api.sendMessage("Name: " + name, threadID, () => {
              api.sendMessage("Tags: " + tags, threadID, () => {
                api.sendMessage(link, threadID, () => {
                  fs.unlinkSync(filename);
                });
              });
            });
          });
        }
      );
    }

    /* ==================== Game Commands ==================== */

    //lấy thông tin osu!
    if (contentMessage.indexOf(`${prefix}osuinfo -u`) == 0) {
      var username = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();
      if (osuAPI == '' || osuAPI == undefined)
        return api.sendMessage("Bot chưa có steam api!!", threadID, messageID);
      var osuApi = new osu.Api(`${osuAPI}`, {
        notFoundAsError: true,
        completeScores: false
      });
      var main = osuApi
        .apiCall("/get_user", {
          u: username
        })
        .then(user => {
          api.sendMessage(
            `OSU INFO\n - username : ` +
              user[0].username +
              `\n - level :` +
              user[0].level +
              `\n - playcount :` +
              user[0].playcount +
              `\n - CountryRank : ` +
              user[0].pp_country_ran +
              `\n - Total PP* : ` +
              user[0].pp_raw +
              `\n - Hit Accuracy :` +
              user[0].accuracy,
            threadID,
            messageID
          );
        });
      return;
    }

    if (contentMessage.indexOf(`${prefix}steam`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      if (steamAPI == "" || steamAPI == undefined)
        return api.sendMessage("Bot chưa có steam api!!", threadID, messageID);
      var baseURL = "http://api.steampowered.com";

      //get steamID
      if (content.indexOf("csgostat") == 0) {
        var steamID = content.slice(9, content.length);
        if (steamID.length == 0)
          return api.sendMessage(
            "bạn chưa nhập steamid, vui lòng thử lại",
            threadID,
            messageID
          );
        var getURL =
          baseURL +
          "/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=" +
          steamAPI +
          "&steamid=" +
          steamID;

        getURL = encodeURI(getURL);
        request(
          {
            uri: getURL
          },
          (err, response, body) => {
            if (err) throw err;
            // console.log(response);
            //  console.log(body);
            if (body.indexOf("Internal Server Error") !== -1)
              return api.sendMessage(
                "steamID chưa mở toàn bộ Privacy hoặc không có game cũng có thể là steamID không tồn tại !!!",
                threadID,
                messageID
              );
            var json = JSON.parse(body);
            var data = json.playerstats.stats;
            //console.log(data);
            //console.log(data.find(item => item.name == "total_kills").value);
            api.sendMessage(
              "Thông tin ingame: \n - Tên: " +
                json.playerstats.gameName +
                "\n - Số kill đạt được: " +
                data.find(item => item.name == "total_kills").value +
                " \n - Số lần đã chết: " +
                data.find(item => item.name == "total_deaths").value +
                "\n - kd: " +
                (data[0]["value"] / data[1]["value"]).toFixed(2) +
                "\n - thời gian đã chơi trong mm: " +
                Math.floor(
                  data.find(item => item.name == "total_time_played").value /
                    60 /
                    60
                ) +
                " hours\n - Số lần đã đặt bomb: " +
                data.find(item => item.name == "total_planted_bombs").value +
                "\n - Số lần đã gỡ bomb: " +
                data.find(item => item.name == "total_defused_bombs").value +
                "\n - Số round đã thắng: " +
                data.find(item => item.name == "total_wins").value +
                "\n - Số lần mvp: " +
                data.find(item => item.name == "total_mvps").value +
                "\n - Số match đã chơi: " +
                data.find(item => item.name == "total_matches_played").value +
                "\n -Số match đã thắng: " +
                data.find(item => item.name == "total_matches_won").value,
              threadID,
              messageID
            );
          }
        );
        return;
      }

      if (content.indexOf("checkban") == 0) {
        var input = content.slice(9, content.length);
        if (!input)
          return api.sendMessage(
            "bạn chưa nhập thông tin",
            threadID,
            messageID
          );
        var getURL =
          baseURL +
          "/ISteamUser/GetPlayerBans/v1/?key=" +
          steamAPI +
          "&steamids=" +
          input;
        getURL = encodeURI(getURL);
        request(
          {
            uri: getURL
          },
          (err, response, body) => {
            if (body.indexOf("[]") !== -1)
              return api.sendMessage(
                "Bạn đã nhập sai steamID hoặc steamID không tồn tại",
                threadID,
                messageID
              );
            var data = JSON.parse(body).player[0];
            api.sendMessage(
              " - Community ban: " +
                data.CommunityBanned +
                "\n - Vac: " +
                data.VACBanned +
                "\n - Số lần bị ban: " +
                data.NumberOfVACBans +
                "\n - Số lần bị Game ban: " +
                data.NumberOfGameBans +
                "\n - Trade ban: " +
                data.EconomyBan +
                "\n - Số ngày sau khi bị ban: " +
                data.DaysSinceLastBan,
              threadID,
              messageID
            );
          }
        );
        return;
      }

      if (content.indexOf("getid") == 0) {
        var input = content.slice(6, content.length);
        if (input.length == 0)
          return api.sendMessage(
            "bạn chưa nhập thông tin",
            threadID,
            messageID
          );
        var getURL =
          baseURL +
          "/ISteamUser/ResolveVanityURL/v0001/?key=" +
          steamAPI +
          "&vanityurl=" +
          input;

        getURL = encodeURI(getURL);
        request(
          {
            uri: getURL
          },
          (err, response, body) => {
            if (err) throw err;
            if (body.indexOf("No match") !== -1)
              return api.sendMessage(
                "Username không tồn tại!",
                threadID,
                messageID
              );
            var data = JSON.parse(body);
            api.sendMessage(
              "steamID của username " + input + " là: " + data.response.steamid,
              threadID,
              messageID
            );
          }
        );

        return;
      }

      return;
    }
    /*todo list:
     - Game LOL: no api, i cant do this thing "/
     - Game CSGO: done
     - Game Dota2
     - More and More
    
      
/* ==================== Economy and Minigame Commands ==================== */

    //coin flip
    if (contentMessage.indexOf(`${prefix}coinflip`) == 0) {
      let random = Math.floor(Math.random() * Math.floor(2));
      if (random === 0) {
        api.sendMessage("Mặt ngửa!", threadID, messageID);
      } else {
        api.sendMessage("Mặt sấp!", threadID, messageID);
      }
      return;
    }

    //kéo búa bao
    if (
      contentMessage.indexOf(`${prefix}kéo`) !== -1 ||
      contentMessage.indexOf(`${prefix}búa`) !== -1 ||
      contentMessage.indexOf(`${prefix}bao`) !== -1
    ) {
      let random = Math.floor(Math.random() * Math.floor(2));
      if (random == 0) return api.sendMessage(`kéo nè`, threadID, messageID);
      else if (random == 1)
        return api.sendMessage(`búa nè`, threadID, messageID);
      else if (random == 2)
        return api.sendMessage(`bao nè`, threadID, messageID);
      return;
    }

    //getCoin
    if (contentMessage == `${prefix}mymoney`) {
      economy
        .getMoney(senderID)
        .then(money =>
          api.sendMessage(
            "Đây là số tiền bạn có: " + money,
            threadID,
            messageID
          )
        );
      return;
    }

    //cheat code
    if (
      contentMessage.indexOf(`${prefix}setmoney`) == 0 &&
      admins.includes(senderID)
    ) {    
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        economy.updateMoney(Object.keys(event.mentions)[i], 5000);
      }
      return;
    }

    if (
      contentMessage.indexOf(`${prefix}setdefault`) == 0 &&
      admins.includes(senderID)
    ) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        economy.setDefaultMoney(Object.keys(event.mentions)[i]);
      }
      return;
    }

    if (contentMessage.indexOf(`${prefix}daily`) == 0) {
      let cooldown = 8.64e7; //86400000;
      let amount = 200;
      economy.getDailyTime(senderID).then(function(lastDaily) {
        if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
          let time = ms(cooldown - (Date.now() - lastDaily));
          api.sendMessage(
            " Bạn đã nhận phần thưởng của ngày hôm nay, vui lòng quay lại sau: " +
              time.hours +
              " giờ " +
              time.minutes +
              " phút " +
              time.seconds +
              " giây ",
            threadID,
            messageID
          );
        } else {
          api.sendMessage(
            "Bạn đã nhận phần thưởng của ngày hôm nay. Cố gắng lên nhé <3",
            threadID,
            () => {
              economy.updateMoney(senderID, amount);
              economy.updateDailyTime(senderID, Date.now());
              modules.log("User: " + senderID + " nhận daily thành công!");
            },
            messageID
          );
        }
      });
      return;
    }

    if (contentMessage == `${prefix}thăm ngàn`) {
      let cooldown = 600000;
      economy.getWorkTime(senderID).then(function(lastWork) {
        if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
          let time = ms(cooldown - (Date.now() - lastWork));
          api.sendMessage(
            " Bạn đã thăm ngàn, để tránh bị kiệt sức vui lòng quay lại sau: " +
              time.hours +
              " giờ " +
              time.minutes +
              " phút " +
              time.seconds +
              " giây ",
            threadID,
            messageID
          );
        } else {
          let job = [
            "bán vé số",
            "sửa xe",
            "lập trình",
            "hack facebook",
            "thợ sửa ống nước ( ͡° ͜ʖ ͡°)",
            "đầu bếp",
            "thợ hồ",
            "fake taxi",
            "gangbang người khác",
            "re sờ chym mờ",
            "bán hàng online",
            "nội trợ",
            "vả mấy thằng sao đỏ, giun vàng",
            "bán hoa"
          ];
          let result = Math.floor(Math.random() * job.length);
          let amount = Math.floor(Math.random() * 500) + 1;
          api.sendMessage(
            "Bạn đã làm công việc " +
              job[result] +
              " và đã nhận được số tiền là: " +
              amount,
            threadID,
            () => {
              economy.updateMoney(senderID, amount);
              economy.updateWorkTime(senderID, Date.now());
              modules.log("User: " + senderID + " nhận job thành công!");
            },
            messageID
          );
        }
      });
      return;
    }

    if (contentMessage.indexOf(`${prefix}roul`) == 0) {
      economy.getMoney(senderID).then(function(moneydb) {
        var content = contentMessage.slice(
          prefix.length + 5,
          contentMessage.length
        ); // red 500
        if (content.length == 0)
          return api.sendMessage(
            `Bạn chưa nhập thông tin đặt cược!`,
            threadID,
            messageID
          );
        var string = content.split(" ");
        var color = string[0];
        var money = string[1];

        function isOdd(num) {
          if (num % 2 == 0) return false;
          else if (num % 2 == 1) return true;
        }

        let random = Math.floor(Math.random() * 37);
        if (money.length == 0 || color.length == 0)
          return api.sendMessage("Sai format", threadID, messageID);
        if (money > moneydb)
          return api.sendMessage(
            `Số tiền của bạn không đủ`,
            threadID,
            messageID
          );
        if (color == "b" || color.includes("black")) color = 0;
        else if (color == "r" || color.includes("red")) color = 1;
        else if (color == "g" || color.includes("green")) color = 2;
        else
          return api.sendMessage(
            "Bạn chưa nhập thông tin cá cược!, Red [1.5x] Black [2x] Green [15x]",
            threadID,
            messageID
          );
        
        if (random == 0) api.sendMessage('Màu 💚', threadID, messageID)
        else if (isOdd(random)) api.sendMessage('Màu ❤️', threadID, messageID)
        else if (!isOdd(random)) api.sendMessage('Màu 🖤', threadID, messageID)
        

        if (random == 0 && color == 2) {
          money *= 15;
          api.sendMessage(
            `bạn đã chọn màu 💚, bạn đã thắng với số tiền được nhân lên 15: ${money} đô`,
            threadID,
            () => {
              economy.updateMoney(senderID, money);
            },
            messageID
          );
          modules.log(`${senderID} Won ${money} on green`);
        } else if (isOdd(random) && color == 1) {
          money = parseInt(money * 1.5);
          api.sendMessage(
            `bạn đã chọn màu ❤️, bạn đã thắng với số tiền nhân lên 1.5: ${money} đô`,
            threadID,
            () => {
              economy.updateMoney(senderID, money);
            },
            messageID
          );
          modules.log(`${senderID} Won ${money} on red`);
        } else if (!isOdd(random) && color == 0) {
          money = parseInt(money * 2);
          api.sendMessage(
            `bạn đã chọn màu 🖤️, bạn đã thắng với số tiền nhân lên 2: ${money} đô`,
            threadID,
            () => {
              economy.updateMoney(senderID, money);
            },
            messageID
          );
          modules.log(`${senderID} Won ${money} on black`);
        } else {
          api.sendMessage(
            `bạn đã ra đê ở và mất trắng số tiền: ${money} đô :'(`,
            threadID,
            () => {
              economy.subtractMoney(senderID, money);
            },
            messageID
          );
        }
      });
      return;
    }

    /* ==================== Media Commands ==================== */

    //get video facebook
    if (contentMessage.indexOf(`${prefix}facebook -p`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 12,
        contentMessage.length
      );
      console.log(content);
      var geturl = "";
      if (content.length == 0)
        return api.sendMessage(`Bạn chưa nhập link`, threadID, messageID);
      api.sendMessage("Đợi em một xíu...", threadID, messageID);
      require("fb-video-downloader")
        .getInfo(content)
        .then(info => {
          let gg = JSON.stringify(info, null, 2);
          let data = JSON.parse(gg);
          let urldata = data.download.sd;
          console.log(urldata);
          const dlfb = require("./modules/fbdl");
          console.log(geturl);
          //var textdemo = geturl.download.sd;
          let callback = function() {
            let up = {
              body: "",
              attachment: fs.createReadStream(__dirname + "/src/video.mp4")
            };
            api.sendMessage(up, threadID, () => {
              fs.unlinkSync(__dirname + "/src/video.mp4");
            });
          };
          dlfb.take(urldata, callback);
        });
      return;
    }

    //get video youtube
    if (contentMessage.indexOf(`${prefix}youtube -p`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(
          " Bạn chưa nhập link youtube!",
          threadID,
          messageID
        );

      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 360)
          return api.sendMessage(
            "Độ dài video vượt quá mức cho phép, tối thiểu là 5 phút!",
            threadID,
            messageID
          );
        api.sendMessage(
          ` đợi em một xíu em đang xử lý...`,
          threadID,
          messageID
        );
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/video.mp4")
          };
          api.sendMessage(up, threadID, () => {
            fs.unlinkSync(__dirname + "/src/video.mp4");
          });
        };
        playvideo.youtube(
          contentMessage
            .slice(prefix.length + 11, contentMessage.length)
            .trim(),
          callback
        );
      });

      return;
    }

    //get audio youtube
    if (contentMessage.indexOf(`${prefix}youtube -m`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập link!", threadID, messageID);

      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 360)
          return api.sendMessage(
            "Độ dài video vượt quá mức cho phép, tối thiểu là 5 phút!",
            threadID,
            messageID
          );
        api.sendMessage(
          " đợi em một xíu em đang xử lý...",
          threadID,
          messageID
        );
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/music.mp3")
          };
          api.sendMessage(up, threadID, () => {
            fs.unlinkSync(__dirname + "/src/music.mp3");
          });
        };
        music.youtube(
          contentMessage
            .slice(prefix.length + 11, contentMessage.length)
            .trim(),
          callback
        );
      });
      return;
    }

    //get search data youtube
    if (contentMessage.indexOf(`${prefix}youtube -s`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      var youtube = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&key=${googleSearch}&q=`;
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập thông tin");
      request(youtube + encodeURIComponent(content), function(
        err,
        response,
        body
      ) {
        if (err) {
          api.sendMessage("Lỗi cmnr :|", threadID, messageID);
          return;
        }
        var retrieve = JSON.parse(body);
        var link = retrieve.items[0].id.videoId;
        var title = retrieve.items[0].snippet.title;
        var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
        let callback = function() {
          let up = {
            body: ``,
            attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
          };
          api.sendMessage(
            title,
            threadID,
            () => {
              api.sendMessage(up, threadID, () => {
                fs.unlinkSync(__dirname + "/src/thumbnails.png");
                api.sendMessage(
                  `https://www.youtube.com/watch?v=` + link,
                  threadID
                );
              });
            },
            messageID
          );
        };
        request(thumbnails)
          .pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`))
          .on("close", callback);
      });
      return;
    }
  };
};
/* 1510 line commands was made by Catalizcs(roxtigger2003) and SpermLord(spermlord) with love <3, pls dont delete this credits! THANKS very much */
