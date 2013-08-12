
/*
 * GET home page.
 */

var placeholders = [
  ["Sir Bearington's Adventure House", "fantasy, d20-like, bears"],
  ["Wrathful Path of the Monkey Ninja", "humor, rules-light, poo flinging"],
  ["Josh's basement", "DnD, high-fantasy, Mt. Dew"],
  ["Warriors of the Night", "night, vampires, totally-not-twilight"],
];


exports.index = function(req, res){
  res.render('index', {
    placeholder: placeholders[Math.floor(Math.random()*placeholders.length)]
  });
};

exports.chat = require('./chat.js');
