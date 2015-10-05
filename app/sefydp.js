Matches = new Mongo.Collection("matches");

if (Meteor.isClient) {
    Meteor.subscribe("userStatus");
    Meteor.subscribe("matches");

    Session.setDefault('userSelection', null);

    Template.rps.helpers({
        userSelection: () => {
            return Session.get('userSelection');
        },
        userInMatch: () => {
            /* Returns true if the user is currently in a RPS match.
             */
            return Matches.find({
                $or: [
                    {playerOne: Meteor.user().username},
                    {playerTwo: Meteor.user().username}
                ]
            }).count() > 0;
        },
        matches: () => {
            return Matches.find({
                $or: [
                    {playerOne: Meteor.user().username},
                    {playerTwo: Meteor.user().username}
                ]
            }, {sort: {date: -1}});
        },
        waitingForOtherPlayer: function() {
            /* Returns true if opponent still has to make a move */
            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            var match = Matches.find(this._id);
            return this[otherPlayer] === undefined;
        },
        makeMove: function() {
            /* Return true if the player still has to make a move */
            return this[Meteor.user().username] === undefined;
        }
    });

    Template.rps.events({
        'click .rps': function(event) {
            // Add a key indicating the user's choice and checks for winner if possible
            var updateQuery = {$set: {}};
            var choice = event.target.value;
            updateQuery.$set[Meteor.user().username + ".choice"] = event.target.value;
            Matches.update(this._id, updateQuery);

            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            if(this[otherPlayer] !== undefined) {
                /* Really ugly way to find the winner, refactor this later */
                var getWinner = function(playerOneName, playerTwoName) {
                    var playerOneChoice = choice;
                    var playerTwoChoice = this[playerTwoName].choice;
                    if ((playerOneChoice === "rock" && playerTwoChoice ==="scissors") ||
                        (playerOneChoice === "scissors" && playerTwoChoice ==="paper") ||
                        (playerOneChoice === "paper" && playerTwoChoice ==="rock")) {
                        Matches.update(this._id, {$set: {winner: playerOneName}});
                    } else if ((playerTwoChoice === "rock" && playerOneChoice ==="scissors") ||
                               (playerTwoChoice === "scissors" && playerOneChoice ==="paper") ||
                               (playerTwoChoice === "paper" && playerOneChoice ==="rock")) {
                        Matches.update(this._id, {$set: {winner: playerTwoName}});
                    } else {
                        Matches.update(this._id, {$set: {winner: "tie"}});
                    }
                }.bind(this);
                getWinner(Meteor.user().username, otherPlayer);
            }
        }
    });

    Template.userCount.helpers({
        usersOnline: () => {
            return Meteor.users.find({"status.online": true, _id: {$ne: Meteor.userId()}});
        },
        usersOnlineCount: () => {
            return Meteor.users.find({ "status.online": true}).count();
        }
    });

    Template.userCount.events({
        "click .user": function(event) {
            console.log(event);
            console.log(this);

            var thisPlayer = Meteor.user().username;
            var otherPlayer = event.target.value;

            Matches.insert({
                playerOne: thisPlayer,
                playerTwo: otherPlayer,
                date: new Date()
            });

        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        Meteor.publish("userStatus", () => {
            return Meteor.users.find({"status.online": true});
        });
        Meteor.publish("matches", () => {
            return Matches.find();
        });
    });
}