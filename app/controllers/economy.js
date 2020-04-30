const logger = require("../modules/log.js");
module.exports = function({ models, api }) {
  const User = models.use("user");
/* ==================== Daily ==================== */

  function getDailyTime(uid) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.get({ plain: true }).dailytime;
      });
  }
  
  function updateDailyTime(uid, time) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.update({
          dailytime: time
        });
      })
      .then(function() {
        return true;
      })
      .catch(function(error) {
        logger(error, 2);
        return false;
      });
  }
  
/* ==================== Work ==================== */

  function getWorkTime(uid) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.get({ plain: true }).worktime;
      });
  }
  
  function updateWorkTime(uid, time) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.update({
          worktime: time
        });
      })
      .then(function() {
        return true;
      })
      .catch(function(error) {
        logger(error, 2);
        return false;
      });
  }
  
/* ==================== Money ==================== */

  function getMoney(uid) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.get({ plain: true }).economy;
      });
      //.then(e => getInfo(e.economy));
  }
  
  function updateMoney(uid, moneyIncrement) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        const moneyData = user.get({ plain: true }).economy;
        return user.update({
          economy: moneyIncrement + moneyData
        });
      })
      .then(function() {
        return true;
      })
      .catch(function(error) {
        logger(error, 2);
        return false;
      });
  }
  
  function subtractMoney(uid, moneyIncrement) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        const moneyData = user.get({ plain: true }).economy;
        return user.update({
          economy: moneyData - moneyIncrement
        });
      })
      .then(function() {
        return true;
      })
      .catch(function(error) {
        logger(error, 2);
        return false;
      });
  }
  function setDefaultMoney(uid) {
    return User.findOne({
      where: {
        uid
      }
    })
      .then(function(user) {
        if (!user) return;
        return user.update({
          economy: 0
        });
      })
      .then(function() {
        return true;
      })
      .catch(function(error) {
        logger(error, 2);
        return false;
      });
  }
  return {
    getDailyTime,
    updateDailyTime,
    getWorkTime,
    updateWorkTime,
    getMoney,
    updateMoney,
    subtractMoney,
    setDefaultMoney
  };
};
