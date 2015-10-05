(function(){
Template.body.addContent((function() {
  var view = this;
  return [ HTML.Raw("<h1>Rock, Paper, Scissors Posse</h1>\n    "), Spacebars.include(view.lookupTemplate("userCount")), "\n    ", Spacebars.include(view.lookupTemplate("loginButtons")), "\n    ", Blaze.If(function() {
    return Spacebars.call(view.lookup("currentUser"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("rps")), "\n    " ];
  }) ];
}));
Meteor.startup(Template.body.renderToDocument);

Template.__checkName("matches");
Template["matches"] = new Template("Template.matches", (function() {
  var view = this;
  return Blaze.Each(function() {
    return Spacebars.call(view.lookup("matches"));
  }, function() {
    return "\n        matchName\n    ";
  });
}));

Template.__checkName("rps");
Template["rps"] = new Template("Template.rps", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("userInMatch"));
  }, function() {
    return [ "\n        ", Blaze.Each(function() {
      return Spacebars.call(view.lookup("matches"));
    }, function() {
      return [ "\n            ", HTML.DIV("\n                ", HTML.H3(Blaze.View("lookup:playerOne", function() {
        return Spacebars.mustache(view.lookup("playerOne"));
      }), " vs. ", Blaze.View("lookup:playerTwo", function() {
        return Spacebars.mustache(view.lookup("playerTwo"));
      })), "\n                ", Blaze.If(function() {
        return Spacebars.call(view.lookup("makeMove"));
      }, function() {
        return [ "\n                    ", HTML.DIV("\n                        ", HTML.BUTTON({
          id: "rock",
          "class": "rps",
          value: "rock"
        }, "Rock"), "\n                        ", HTML.BUTTON({
          id: "paper",
          "class": "rps",
          value: "paper"
        }, "Paper"), "\n                        ", HTML.BUTTON({
          id: "scissors",
          "class": "rps",
          value: "scissors"
        }, "Scissors"), "\n                        ", HTML.P("Select your move!"), "\n                    "), "\n                " ];
      }, function() {
        return [ "\n                    ", Blaze.If(function() {
          return Spacebars.call(view.lookup("waitingForOtherPlayer"));
        }, function() {
          return [ "\n                    ", HTML.DIV("Waiting for other player"), "\n                    " ];
        }, function() {
          return [ "\n                    ", HTML.DIV("Winner is ", Blaze.View("lookup:winner", function() {
            return Spacebars.mustache(view.lookup("winner"));
          })), "\n                    " ];
        }), "\n                " ];
      }), "\n            "), "\n        " ];
    }), "\n    " ];
  }, function() {
    return [ "\n        ", HTML.DIV("\n            ", HTML.P("Challenge someone above!"), "\n        "), "\n    " ];
  });
}));

Template.__checkName("userCount");
Template["userCount"] = new Template("Template.userCount", (function() {
  var view = this;
  return HTML.DIV("\n        ", HTML.H2(Blaze.View("lookup:usersOnlineCount", function() {
    return Spacebars.mustache(view.lookup("usersOnlineCount"));
  }), " human beings online"), HTML.Raw("\n        <h2>Challenge someone!</h2>\n        "), Blaze.Each(function() {
    return Spacebars.call(view.lookup("usersOnline"));
  }, function() {
    return [ "\n            ", HTML.DIV("\n                ", HTML.BUTTON({
      "class": "user",
      value: function() {
        return Spacebars.mustache(view.lookup("username"));
      }
    }, Blaze.View("lookup:username", function() {
      return Spacebars.mustache(view.lookup("username"));
    })), "\n            "), "\n        " ];
  }), "\n    ");
}));

}).call(this);
