(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// sefydp.js                                                           //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
Matches = new Mongo.Collection("matches");                             // 1
                                                                       //
if (Meteor.isClient) {                                                 // 3
    Meteor.subscribe("userStatus");                                    // 4
    Meteor.subscribe("matches");                                       // 5
                                                                       //
    Session.setDefault('userSelection', null);                         // 7
                                                                       //
    Template.rps.helpers({                                             // 9
        userSelection: function () {                                   // 10
            return Session.get('userSelection');                       // 11
        },                                                             //
        userInMatch: function () {                                     // 13
            /* Returns true if the user is currently in a RPS match.   //
             */                                                        //
            return Matches.find({                                      // 16
                $or: [{ playerOne: Meteor.user().username }, { playerTwo: Meteor.user().username }]
            }).count() > 0;                                            //
        },                                                             //
        matches: function () {                                         // 23
            return Matches.find({                                      // 24
                $or: [{ playerOne: Meteor.user().username }, { playerTwo: Meteor.user().username }]
            });                                                        //
        },                                                             //
        waitingForOtherPlayer: function () {                           // 31
            /* Returns true if opponent still has to make a move */    //
            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            var match = Matches.find(this._id);                        // 34
            return this[otherPlayer] === undefined;                    // 35
        },                                                             //
        makeMove: function () {                                        // 37
            /* Return true if the player still has to make a move */   //
            return this[Meteor.user().username] === undefined;         // 39
        }                                                              //
    });                                                                //
                                                                       //
    Template.rps.events({                                              // 43
        'click .rps': function (event) {                               // 44
            // Add a key indicating the user's choice and checks for winner if possible
            var updateQuery = { $set: {} };                            // 46
            var choice = event.target.value;                           // 47
            updateQuery.$set[Meteor.user().username + ".choice"] = event.target.value;
            Matches.update(this._id, updateQuery);                     // 49
                                                                       //
            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            if (this[otherPlayer] !== undefined) {                     // 52
                /* Really ugly way to find the winner, refactor this later */
                var getWinner = (function (playerOneName, playerTwoName) {
                    var playerOneChoice = choice;                      // 55
                    var playerTwoChoice = this[playerTwoName].choice;  // 56
                    if (playerOneChoice === "rock" && playerTwoChoice === "scissors" || playerOneChoice === "scissors" && playerTwoChoice === "paper" || playerOneChoice === "paper" && playerTwoChoice === "rock") {
                        Matches.update(this._id, { $set: { winner: playerOneName } });
                    } else if (playerTwoChoice === "rock" && playerOneChoice === "scissors" || playerTwoChoice === "scissors" && playerOneChoice === "paper" || playerTwoChoice === "paper" && playerOneChoice === "rock") {
                        Matches.update(this._id, { $set: { winner: playerTwoName } });
                    } else {                                           //
                        Matches.update(this._id, { $set: { winner: "tie" } });
                    }                                                  //
                }).bind(this);                                         //
                getWinner(Meteor.user().username, otherPlayer);        // 69
            }                                                          //
        }                                                              //
    });                                                                //
                                                                       //
    Template.userCount.helpers({                                       // 74
        usersOnline: function () {                                     // 75
            return Meteor.users.find({ "status.online": true, _id: { $ne: Meteor.userId() } });
        },                                                             //
        usersOnlineCount: function () {                                // 78
            return Meteor.users.find({ "status.online": true }).count();
        }                                                              //
    });                                                                //
                                                                       //
    Template.userCount.events({                                        // 83
        "click .user": function (event) {                              // 84
            console.log(event);                                        // 85
            console.log(this);                                         // 86
                                                                       //
            var thisPlayer = Meteor.user().username;                   // 88
            var otherPlayer = event.target.value;                      // 89
                                                                       //
            Matches.insert({                                           // 91
                playerOne: thisPlayer,                                 // 92
                playerTwo: otherPlayer                                 // 93
            });                                                        //
        }                                                              //
    });                                                                //
                                                                       //
    Accounts.ui.config({                                               // 99
        passwordSignupFields: "USERNAME_ONLY"                          // 100
    });                                                                //
}                                                                      //
                                                                       //
if (Meteor.isServer) {                                                 // 104
    Meteor.startup(function () {                                       // 105
        Meteor.publish("userStatus", function () {                     // 106
            return Meteor.users.find({ "status.online": true });       // 107
        });                                                            //
        Meteor.publish("matches", function () {                        // 109
            return Matches.find();                                     // 110
        });                                                            //
    });                                                                //
}                                                                      //
/////////////////////////////////////////////////////////////////////////

}).call(this);
